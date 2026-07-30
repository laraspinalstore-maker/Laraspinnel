# Security



## 1. URGENT: every production secret is exposed and must be rotated

**Severity: Critical. Not fixed by code changes. Requires manual action.**

A file named `example.txt` containing the complete live production environment
was committed to this repository, and the repository has a remote at
`github.com/senthilnathan-2004/laraspinnel`. The file was deleted in a later
commit, but **deleting a file does not remove it from git history** — it is still
readable in the objects of every clone and of the remote:

```bash
git show 74ca32e:example.txt          # the leaked file, still intact
git log --all --oneline -- example.txt
```

A second file, `test-login.ts`, committed the admin account's plaintext password.

Assume every value below is known to third parties. Public GitHub repositories
are continuously scraped for exactly this pattern, usually within minutes of a
push.

### 1a. Rotate these credentials — all of them, in this order

| Secret | Where to rotate | Notes |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas → Database Access | Change the password. **Also review Network Access:** if it allows `0.0.0.0/0`, the leaked URI alone was enough to read and delete the entire database. Restrict it to Vercel's egress ranges. |
| `NEXTAUTH_SECRET` | Generate new: `openssl rand -hex 32` | This signs admin session JWTs. With the old value an attacker can **forge a valid admin session cookie without any password.** Rotating it invalidates all existing sessions, which is intended. |
| `SEED_ADMIN_PASSWORD` | Change, then see §2 | Was also leaked in `test-login.ts`. |
| Admin account password | `npx tsx scripts/create-admin.ts` | Run after setting a new `SEED_ADMIN_PASSWORD`. |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit dashboard → Developer options | Allows arbitrary upload and **deletion** of all media. |
| `SMTP_PASS` | Email provider (app password) | Allows sending mail as your domain — i.e. phishing your own customers. |
| `RESEND_API_KEY` | Resend dashboard | Same exposure as above. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash console | Full read/write on the rate-limit store. |

Rotate in the provider first, then update Vercel's environment variables, then
redeploy. Do **not** put the new values in any file in this repository.

### 1b. Check for evidence of use

Before assuming no harm: review MongoDB Atlas access logs, ImageKit's media
activity, and your email provider's sending history for the period since the
first push. Look for unfamiliar IPs and for mail you did not send.

### 1c. Purging git history (optional, and it does not replace rotation)

Rotation is what actually protects you. History rewriting only stops future
readers of the repo, and it cannot un-leak what has already been scraped.

If you also want the history cleaned, this **rewrites published history** — every
collaborator must re-clone, and open PRs will break. Only do this deliberately:

```bash
# Back up first.
git clone --mirror https://github.com/senthilnathan-2004/laraspinnel.git backup.git

# Requires git-filter-repo (pip install git-filter-repo)
git filter-repo --invert-paths --path example.txt --path test-login.ts

git push --force --all
git push --force --tags
```

Then ask GitHub Support to expire cached views of the old objects, since fork and
cache references can survive a force-push.

### 1d. Make the repository private if it does not need to be public

There is no reason for a commercial store's source to be world-readable.

---

## 2. Admin accounts

### Creating the first admin

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, then either:

- **Preferred:** run `npx tsx scripts/create-admin.ts`, or
- log in once at `/admin/login` with those credentials, which creates the
  account. In production this bootstrap path additionally requires
  `ALLOW_ADMIN_BOOTSTRAP=true`.

### Rotating an admin password

```bash
# set the new SEED_ADMIN_PASSWORD in your environment first
npx tsx scripts/create-admin.ts
```

### Why the env credentials are no longer a permanent login

`lib/auth.ts` previously compared the submitted password against
`SEED_ADMIN_PASSWORD` with `===`, and on every successful match it **overwrote
the stored bcrypt hash** to match the env value. Two consequences:

- the env var behaved as an unrevocable master password, so an env leak (which is
  exactly what happened — see §1) granted permanent admin access; and
- you could not rotate the real admin password while the env var was set,
  because the next login silently reset it.

Now the env credential is honoured **only while no admin account exists**, is
compared in constant time, and is refused in production unless
`ALLOW_ADMIN_BOOTSTRAP=true`. Once a real admin exists, that account's own
password is the only way in.

**Unset `SEED_ADMIN_PASSWORD` in production once your admin account exists.**

---

## 3. Environment variables

`lib/security/env.ts` validates the environment on the first authenticated
request. In production a missing or weak `NEXTAUTH_SECRET`, a missing
`MONGODB_URI`, a non-HTTPS `NEXTAUTH_URL`, or a short `SEED_ADMIN_PASSWORD` is a
hard error. Validation is skipped during `next build`, where deployment secrets
are legitimately absent.

Required in production:

```
MONGODB_URI                  # rotate per §1
NEXTAUTH_SECRET              # openssl rand -hex 32, >= 32 chars
NEXTAUTH_URL                 # must be https://
UPSTASH_REDIS_REST_URL       # strongly recommended — see §4
UPSTASH_REDIS_REST_TOKEN
```

Anything named `NEXT_PUBLIC_*` is compiled into the browser bundle and is public
by definition. Never put a secret behind that prefix. `IMAGEKIT_PRIVATE_KEY` is
correctly *not* public — keep it that way.

---

## 4. Rate limiting

Policies live in one table: `RATE_LIMIT_POLICIES` in
`lib/security/rateLimit.ts`.

Upstash Redis is the primary store. **Configure it in production.** Without it,
limiting falls back to per-instance memory, and because each serverless instance
has its own memory the effective limit becomes `limit x instanceCount` — which
is no limit at all under concurrency.

When Upstash is unconfigured, or errors, limiting **degrades to per-instance
memory and logs a `ratelimit.degraded` event** — it does not deny the request.

That is a deliberate reversal of an earlier design in which sensitive policies
denied on a Redis error. Denying looked prudent but created an amplified outage:
flood any cheap endpoint until the Upstash request quota is exhausted, Redis then
errors for everything, and login plus checkout reject every request — the store
goes down, including the owner's way back in. A third-party dependency must not
be able to take the site offline. `failClosed: true` now marks a policy as
security-sensitive for **alerting** only.

Two other properties worth knowing:

- **Bucket keys are hashed** (`bucketKey()`), so an attacker-supplied identifier
  can't grow keys without bound, collide across policies via a `:`, or smuggle
  glob metacharacters into the store.
- **Login lockout counts failures only.** `loginFailuresPerAccount` is consumed
  *after* the password is checked and found wrong. Consulting it beforehand — as
  an earlier version did — let any anonymous caller lock the real administrator
  out of the panel by submitting wrong passwords for their address. A correct
  password is never rejected by a counter.

---

## 5. Security model

**Authorization.** Every route under `app/api/admin/**` calls `requireAdmin()`
from `lib/security/http.ts`, which verifies both a session *and* an admin role.
Checking only "a session exists" is not sufficient and was the previous
behaviour.

**Defense in depth for admin pages.** There are two independent gates:

1. `proxy.ts` (edge) redirects unauthenticated requests away from `/admin`.
2. `app/admin/(dashboard)/layout.tsx` re-checks the session server-side.

The second exists because middleware/proxy bypass is a recurring class of
Next.js advisory, and because all but one admin page is a client component that
would otherwise render its privileged shell before any authorization answer
arrived. `(dashboard)` is a route group, so URLs are unchanged and
`/admin/login` deliberately sits outside it.

**Treat `proxy.ts` as convenience, not as the boundary.** Deleting it must not
grant anyone access.

**Output encoding.** Never interpolate a value into HTML directly. There are two
modules, and the split matters:

- **`lib/security/url.ts`** — dependency-free. Safe to import from client
  components.
- **`lib/security/sanitize.ts`** — imports `sanitize-html`. **Server only.** It
  re-exports everything from `url.ts`, so server code can import from one place.

| Sink | Helper | Module |
|---|---|---|
| Text in HTML or an attribute | `escapeHtml()` | url |
| JSON-LD `<script>` blocks | `serializeJsonLd()` | url |
| `href` | `safeUrl()` | url |
| `<img src>` | `safeImageUrl()` | url |
| Storing an image URL | `isStorableImageUrl()` | url |
| Image URL from an unauthenticated caller | `isOwnImageKitUrl()` | url |
| MongoDB `$regex` operand | `escapeRegex()` | url |
| Plain-text normalization | `stripMarkupText()` | url |
| Admin rich text (`dangerouslySetInnerHTML`) | `sanitizeRichText()` | **sanitize** |
| Stripping markup properly | `stripTags()` | **sanitize** |

**Importing `sanitize.ts` from a client component ships a ~200 KB HTML parser to
the browser.** That happened twice during this work — once via the product page
and once via `lib/validations.ts`, which is shared with the public contact form.
Hence the split. Anything rendered as HTML is sanitized on the **server**:
product descriptions in `app/api/admin/products/route.ts` on write and
`app/api/products/[slug]/route.ts` on read, policy pages in the page component.

`serializeJsonLd` exists because `JSON.stringify` does not escape `<`, so an
admin-editable value containing `</script>` closed the JSON-LD block early and
executed as markup on every page.

**Inventory.** `lib/inventory.ts` owns stock movements for order state changes.
Checkout reserves units; cancelling an order returns them; un-cancelling takes
them again. Both directions are claimed atomically via the order's
`stockRestored` flag, so concurrent or repeated status writes cannot double-credit
stock. Before this existed, cancelled and deleted orders left their units
permanently consumed, quietly shrinking sellable inventory.

**Uploads.** `lib/security/files.ts` identifies files by magic bytes, not by the
client-supplied `Content-Type`, and generates the stored filename server-side.
SVG is deliberately rejected: it is an XML document that can carry script, and
uploads are served from a host inside this app's CSP `img-src`.

**Public uploads.** `POST /api/customer-upload` is unauthenticated by design.
Its `DELETE` is therefore pinned to the `laraspinnal/customer-uploads` folder.
Previously it forwarded any URL to a helper that, failing an exact match, fell
back to the first file with the same *name* — which let anyone destroy product
and banner images anonymously.

**Settings exposure.** `GET /api/settings` is public. What it may expose is
decided by `lib/security/publicSettings.ts`: a denylist always wins over the
content-prefix allowlist. Adding a page-copy key needs no code change; exposing a
credential-shaped one is not possible. It previously returned the entire settings
table to anonymous callers.

The denylist patterns are **substring**, not anchored. An earlier anchored version
(`/^api[_-]?key/`) let any key sitting under a public content prefix through —
`contact_api_key`, `footer_apikey`, `social_auth_key` and `shop_admin_key` were
all publicly readable. If you add patterns, keep them unanchored.

Writes to settings are **all-or-nothing**: if any key is rejected (bad name, or
value over its cap) the whole request 400s and names the offending keys. Applying
the valid subset and silently dropping the rest read as a successful save in the
admin UI while discarding the edit.

**Logging.** Use `logSecurityEvent()` from `lib/security/audit.ts`. Emails and
phone numbers must be passed through `maskEmail()` / `maskPhone()` — application
logs must not become a store of customer PII.

**Errors.** Return `serverError()` from `lib/security/http.ts`. Never send
`error.message` to a client: driver and validation errors disclose collection
names, query shapes and hostnames.

---

## 6. Dependencies

`npm audit` is clean as of this audit (0 critical / 0 high / 0 moderate).

Two things to know when updating:

- **`.npmrc` sets `legacy-peer-deps=true`.** `next-auth` declares `nodemailer@^7`
  as an *optional* peer (used only by its unused `EmailProvider`); this project
  calls `nodemailer@9` directly from `lib/email/sendEmail.ts`. The mismatch is
  inert, and the flag keeps `npm ci` on CI resolving the same tree as local
  installs.
- **`package.json` `overrides`** pin `postcss`, `sharp`, `brace-expansion`,
  `minimatch` and `uuid` to patched versions ahead of their parents releasing
  bumps. Re-check these on each `next` upgrade and drop the pins once the parents
  catch up.

Some `next` advisories have no released fix at `16.2.12` (the latest available).
The relevant one — proxy/middleware bypass — is mitigated by the independent
server-side session check described in §5. Re-run `npm audit` after each `next`
release.

---

## 7. Known remaining work

- **CSP still needs `'unsafe-inline'` for scripts.** `app/layout.tsx` renders the
  Facebook Pixel bootstrap and JSON-LD inline. Those values are now escaped, but
  removing `'unsafe-inline'` requires a per-request nonce threaded from
  `proxy.ts` through the layout. `'unsafe-eval'` is already production-off.
- **No MFA on admin login.** Password plus rate limiting only. For a store
  handling real orders, TOTP on the admin account is worth adding.
- **Single shared admin role.** `admin` and `superadmin` exist in the schema and
  are enforced by `requireAdmin({ role })`, but no route currently requires
  `superadmin`. If you add staff accounts, restrict destructive routes
  (settings, order deletion) to `superadmin`.
- **No virus scanning on uploads.** Type and size are validated; content is not
  scanned. If you later accept documents rather than only images, add a scanning
  step in `lib/security/files.ts`.
- **Unbounded admin list queries.** `GET /api/admin/orders` and
  `GET /api/admin/messages` do `find({})` with no limit. Fine today; as the
  collections grow this becomes a slow response and a memory spike. Add pagination
  before it matters — it was left alone here because truncating an admin's order
  history silently would be worse than the current behaviour.
- **`maxPoolSize: 10` per instance** (`lib/db.ts`). Each serverless instance opens
  its own pool, so concurrency across many instances can exhaust the Atlas
  connection limit. Watch it under load; consider a lower per-instance cap.
- **No `Cross-Origin-Embedder-Policy`.** Deliberate — it would block the Google
  Maps embed that `contact_map_url` exists for, and buys nothing without
  SharedArrayBuffer. Revisit only if cross-origin isolation is ever needed.
- **Testimonial `refId` is not verified against a real order.** Anyone can submit
  a review quoting any reference. Submissions land unapproved (`isActive: false`),
  so the control is admin moderation — just don't read `refId` as proof of
  purchase.

---

## Reporting a vulnerability

Email the address configured as `ADMIN_EMAIL`. Please do not open a public
issue.
