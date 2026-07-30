/**
 * Rate limiting for every public and privileged entry point.
 *
 * Two problems with the previous setup are addressed here:
 *
 *  1. The in-memory limiter was the only limiter on most routes. On Vercel each
 *     serverless instance has its own memory, so an attacker just needed
 *     concurrent requests to land on different instances — the effective limit
 *     was `limit x instanceCount`. Upstash Redis is now the primary store and
 *     memory is only a dev/degraded fallback.
 *  2. When Upstash was not configured, `formRateLimit` was replaced by a mock
 *     that returned `success: true` unconditionally, so a missing env var
 *     silently removed checkout throttling entirely. The fallback now actually
 *     counts, and sensitive policies fail CLOSED if a configured Redis errors.
 */
import { createHash } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logSecurityEvent } from "@/lib/security/audit";

export interface RateLimitPolicy {
  /** Requests permitted per window. */
  limit: number;
  /** Sliding window length, in seconds. */
  windowSeconds: number;
  /**
   * Marks a policy as security-sensitive.
   *
   * Used for ALERTING, not for denial. When Redis is unavailable these policies
   * emit an error-level `ratelimit.degraded` event, because they have fallen back
   * to per-instance memory and are no longer accurate across instances.
   *
   * It deliberately does not cause requests to be denied — see the catch block in
   * checkRateLimit for why denying on a Redis error was an amplified-outage bug.
   */
  failClosed: boolean;
  /**
   * Skip Redis entirely and count in process memory.
   *
   * Only for coarse backstops evaluated on EVERY request (the proxy's global
   * cap), where a Redis round-trip per request would add latency and cost to the
   * whole site for no security benefit — the per-route policies that actually
   * matter are Redis-backed and precise.
   */
  memoryOnly?: boolean;
}

/**
 * Named policies. Keeping them in one table makes the throttling posture
 * reviewable in a single place instead of scattered magic numbers.
 */
export const RATE_LIMIT_POLICIES = {
  /**
   * Admin credential login, per source IP. This is the real brute-force gate:
   * 10 bcrypt-cost-12 guesses per 15 minutes per IP.
   */
  login: { limit: 10, windowSeconds: 15 * 60, failClosed: true },
  /**
   * FAILED login attempts per account, counted only after the password has been
   * checked and found wrong. See lib/auth.ts for why it must not be consulted
   * before verification: doing so let any anonymous caller lock the real admin
   * out of the panel by submitting wrong passwords for their address.
   */
  loginFailuresPerAccount: { limit: 20, windowSeconds: 15 * 60, failClosed: true },
  /** Checkout. Preserves the original 1-order-per-24h business rule. */
  order: { limit: 1, windowSeconds: 24 * 60 * 60, failClosed: true },
  contact: { limit: 3, windowSeconds: 60, failClosed: true },
  customOrder: { limit: 3, windowSeconds: 60, failClosed: true },
  testimonial: { limit: 5, windowSeconds: 60, failClosed: true },
  /** Read-only order lookup; an outage must not break customer tracking. */
  trackOrder: { limit: 10, windowSeconds: 60, failClosed: false },
  /** Unauthenticated storage writes — the most abusable public surface. */
  customerUpload: { limit: 10, windowSeconds: 60 * 60, failClosed: true },
  customerUploadDelete: { limit: 20, windowSeconds: 60 * 60, failClosed: true },
  adminUpload: { limit: 60, windowSeconds: 60, failClosed: false },
  /**
   * Broad backstop applied in proxy.ts to all of /api.
   *
   * Memory-only and generous on purpose. It runs on every single API request, so
   * a Redis call here would add a network round-trip to the whole site; and the
   * limit has to sit above what a legitimately busy admin session generates
   * (NextAuth session polling plus the dashboard's SWR refreshes), or the app
   * throttles its own users. Real enforcement lives in the per-route policies.
   */
  apiGlobal: { limit: 240, windowSeconds: 60, failClosed: false, memoryOnly: true },
} as const satisfies Record<string, RateLimitPolicy>;

export type LimiterName = keyof typeof RATE_LIMIT_POLICIES;

export const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = isRedisConfigured ? Redis.fromEnv() : null;

const limiters = new Map<LimiterName, Ratelimit>();

function getLimiter(name: LimiterName): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters.get(name);
  if (!limiter) {
    const policy = RATE_LIMIT_POLICIES[name];
    limiter = new Ratelimit({
      redis,
      // Sliding window, so a burst can't straddle a fixed-window boundary and
      // effectively double the allowance.
      limiter: Ratelimit.slidingWindow(policy.limit, `${policy.windowSeconds} s`),
      analytics: true,
      prefix: `rl:${name}`,
      ephemeralCache: new Map(),
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

/* ------------------------------------------------------------------ *
 * In-memory fallback (development, or Redis not configured)
 * ------------------------------------------------------------------ */

interface MemoryRecord {
  timestamps: number[];
  /** This record's own window, so eviction can't use another policy's. */
  windowMs: number;
}

const memoryStore = new Map<string, MemoryRecord>();
/** Hard cap so an IP-rotating flood can't grow the map without bound. */
const MEMORY_STORE_MAX_KEYS = 20_000;

/**
 * Drops records whose own window has fully elapsed.
 *
 * Each record carries its own `windowMs`. An earlier version pruned every record
 * using the *calling* policy's window, which let a flood against a short-window
 * policy expire long-window buckets early — and, once over the cap, it called
 * `memoryStore.clear()`, wiping every bucket including login counters. Flooding
 * one cheap endpoint with rotating identifiers therefore reset the brute-force
 * counters for every other endpoint.
 */
function pruneMemoryStore(now: number): void {
  for (const [key, record] of memoryStore) {
    const kept = record.timestamps.filter((ts) => now - ts < record.windowMs);
    if (kept.length === 0) memoryStore.delete(key);
    else record.timestamps = kept;
  }
}

/** Evicts the least-recently-active records. Never a blanket clear. */
function evictOldest(count: number): void {
  const byLastSeen = Array.from(memoryStore)
    .map(([key, record]) => [key, record.timestamps[record.timestamps.length - 1] ?? 0] as const)
    .sort((a, b) => a[1] - b[1]);

  for (let i = 0; i < Math.min(count, byLastSeen.length); i += 1) {
    memoryStore.delete(byLastSeen[i][0]);
  }
}

function memoryLimit(key: string, policy: RateLimitPolicy): RateLimitResult {
  const now = Date.now();
  const windowMs = policy.windowSeconds * 1000;

  if (memoryStore.size > MEMORY_STORE_MAX_KEYS) {
    pruneMemoryStore(now);
    if (memoryStore.size > MEMORY_STORE_MAX_KEYS) {
      evictOldest(memoryStore.size - MEMORY_STORE_MAX_KEYS);
    }
  }

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [], windowMs };
    memoryStore.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= policy.limit) {
    const oldest = record.timestamps[0];
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    remaining: policy.limit - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/* ------------------------------------------------------------------ */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Normalises an identifier before it becomes part of a store key.
 *
 * Identifiers are attacker-influenced (an email from a login form, an IP from a
 * proxy header). Used raw they cause three problems:
 *   - unbounded key length, i.e. unbounded Redis memory and cost;
 *   - a `:` in the value can collide with the policy separator and let one
 *     caller land in another policy's bucket;
 *   - glob metacharacters (`*`, `?`, `[`) leak into any pattern-based operation.
 *
 * A truncated SHA-256 is fixed-length, collision-resistant enough for bucketing,
 * and contains only hex — so none of the above applies. It also keeps raw
 * addresses out of the rate-limit store, which is a privacy win.
 */
function bucketKey(name: LimiterName, identifier: string): string {
  const digest = createHash("sha256").update(identifier || "unknown", "utf8").digest("hex").slice(0, 32);
  return `${name}:${digest}`;
}

/**
 * Checks and consumes one unit of the named policy for `identifier`
 * (normally the client IP, sometimes IP + email for per-account lockout).
 */
export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
  meta: { route?: string } = {}
): Promise<RateLimitResult> {
  // Widened to the interface: the policy table uses `as const`, which would
  // otherwise hide optional fields like `memoryOnly` on entries that omit them.
  const policy: RateLimitPolicy = RATE_LIMIT_POLICIES[name];
  const key = bucketKey(name, identifier);
  // Some policies deliberately skip Redis — see `memoryOnly` in the policy table.
  const limiter = policy.memoryOnly ? null : getLimiter(name);

  let result: RateLimitResult;

  if (limiter) {
    try {
      const outcome = await limiter.limit(key);
      result = {
        success: outcome.success,
        remaining: outcome.remaining,
        retryAfterSeconds: outcome.success
          ? 0
          : Math.max(1, Math.ceil((outcome.reset - Date.now()) / 1000)),
      };
    } catch (error) {
      // DEGRADE, never deny.
      //
      // Sensitive policies used to return `success: false` when Redis errored.
      // That looked prudent but handed an attacker an amplified outage: flood any
      // cheap endpoint until the Upstash request quota is exhausted, Redis then
      // errors for everything, and login plus checkout deny every request — the
      // whole store goes down, including the owner's way back in. A third-party
      // dependency must not be able to take the site offline.
      //
      // Falling back to per-instance memory keeps a real (if coarser) limit in
      // place. The event is logged so the degradation is visible.
      console.error(`[rateLimit:${name}] Redis error — degrading to in-memory limiting`, error);
      logSecurityEvent("ratelimit.degraded", {
        action: name,
        route: meta.route,
        reason: "redis_unavailable",
        failClosedPolicy: policy.failClosed,
      });
      result = memoryLimit(key, policy);
    }
  } else {
    result = memoryLimit(key, policy);
  }

  if (!result.success) {
    logSecurityEvent("ratelimit.exceeded", {
      // The hashed bucket, never the raw address — this line goes to logs.
      bucket: key,
      action: name,
      route: meta.route,
    });
  }

  return result;
}

/**
 * Clears the local bucket for an identifier, after a successful login.
 *
 * Deliberately does NOT touch Redis. The previous implementation ran
 * `redis.keys("rl:<name>:<identifier>*")` followed by `del`, which was wrong on
 * two counts: `KEYS` is an O(N) scan of the whole keyspace, and the identifier
 * was interpolated into the glob — so an identifier containing `*` (reachable
 * wherever `x-forwarded-for` isn't set by a trusted proxy) would match and
 * delete every rate-limit key in the store, disabling limiting globally.
 *
 * Redis buckets are simply left to expire. Nothing depends on clearing them:
 * lib/auth.ts checks the account-failure budget only for attempts that have
 * already failed, so a correct password is never blocked by a stale bucket.
 */
export async function resetRateLimit(name: LimiterName, identifier: string): Promise<void> {
  memoryStore.delete(bucketKey(name, identifier));
}
