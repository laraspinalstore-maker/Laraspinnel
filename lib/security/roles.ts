/**
 * Single source of truth for admin roles.
 *
 * This exists because the role check was duplicated in three places — the API
 * gate, the edge proxy, and the dashboard layout — each with its own inline list.
 * The lists agreed with each other but not with the database: the real account
 * carried `role: "owner"`, which none of them accepted, so hardening the check
 * from "any session" to "role must be admin" locked the owner out of their own
 * admin panel with a 403.
 *
 * Dependency-free on purpose: proxy.ts runs in the edge runtime and imports this.
 *
 * Anything that needs to know whether a role is privileged must call these
 * helpers rather than re-listing role names.
 */

/** Every role permitted to use the admin panel and the admin API. */
export const ADMIN_ROLES = ["owner", "superadmin", "admin"] as const;

/**
 * Roles allowed to perform destructive or configuration-level actions.
 * `owner` outranks `superadmin`, so it satisfies any elevated requirement.
 */
export const ELEVATED_ROLES = ["owner", "superadmin"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

const ADMIN_ROLE_SET: ReadonlySet<string> = new Set(ADMIN_ROLES);
const ELEVATED_ROLE_SET: ReadonlySet<string> = new Set(ELEVATED_ROLES);

/** True when the role may access the admin panel at all. */
export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && ADMIN_ROLE_SET.has(role);
}

/** True when the role may perform elevated (destructive/config) actions. */
export function isElevatedRole(role: unknown): boolean {
  return typeof role === "string" && ELEVATED_ROLE_SET.has(role);
}

/**
 * Whether `role` satisfies `required`.
 *
 * `required` is the minimum privilege a caller asks for: "admin" means any admin
 * role, "superadmin" means an elevated one (which `owner` also satisfies).
 */
export function satisfiesRole(role: unknown, required: "admin" | "superadmin" = "admin"): boolean {
  return required === "superadmin" ? isElevatedRole(role) : isAdminRole(role);
}
