/**
 * Structured security-event logging.
 *
 * There was previously no record of authentication attempts or destructive
 * admin actions, so a compromise would have left nothing to reconstruct. These
 * emit single-line JSON on stdout/stderr, which Vercel (and any log drain)
 * indexes — so failed logins and admin mutations become queryable and alertable
 * without adding infrastructure.
 *
 * Never pass credentials, tokens, full card/PII payloads, or request bodies to
 * these functions. Identifiers and outcomes only.
 */

export type SecurityEvent =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.login.blocked"
  | "auth.bootstrap.admin_created"
  | "authz.denied"
  | "ratelimit.exceeded"
  | "ratelimit.degraded"
  | "upload.rejected"
  | "upload.accepted"
  | "upload.deleted"
  | "admin.mutation"
  | "order.created"
  | "order.rejected";

type Severity = "info" | "warn" | "error";

const SEVERITY: Record<SecurityEvent, Severity> = {
  "auth.login.success": "info",
  "auth.login.failure": "warn",
  "auth.login.blocked": "error",
  "auth.bootstrap.admin_created": "warn",
  "authz.denied": "warn",
  "ratelimit.exceeded": "warn",
  "ratelimit.degraded": "error",
  "upload.rejected": "warn",
  "upload.accepted": "info",
  "upload.deleted": "info",
  "admin.mutation": "info",
  "order.created": "info",
  "order.rejected": "warn",
};

/**
 * Masks an email to `s***l@gmail.com` so log drains remain useful for
 * correlation without turning application logs into a PII store.
 */
export function maskEmail(email: unknown): string {
  const value = String(email ?? "");
  const at = value.lastIndexOf("@");
  if (at < 1) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at);
  if (local.length <= 2) return `${local[0]}***${domain}`;
  return `${local[0]}***${local[local.length - 1]}${domain}`;
}

/** Masks a phone number to its last two digits. */
export function maskPhone(phone: unknown): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 3) return "***";
  return `***${digits.slice(-2)}`;
}

export interface SecurityEventFields {
  /** Client IP as resolved by getClientIp(). */
  ip?: string;
  /** Masked actor identifier — use maskEmail(). */
  actor?: string;
  /** Resource kind being acted on, e.g. "product", "order". */
  resource?: string;
  /** Resource identifier. */
  resourceId?: string;
  /** HTTP method or logical action. */
  action?: string;
  /** Short machine-readable reason for a denial/rejection. */
  reason?: string;
  [key: string]: unknown;
}

export function logSecurityEvent(event: SecurityEvent, fields: SecurityEventFields = {}): void {
  const severity = SEVERITY[event] ?? "info";
  const line = JSON.stringify({
    kind: "security",
    event,
    severity,
    at: new Date().toISOString(),
    ...fields,
  });

  if (severity === "error") console.error(line);
  else if (severity === "warn") console.warn(line);
  else console.log(line);
}
