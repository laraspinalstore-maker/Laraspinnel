import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";
import { isAdminRole } from "@/lib/security/roles";

/**
 * Server-side authorization gate for the whole admin dashboard.
 *
 * `(dashboard)` is a route group, so URLs are unchanged (/admin, /admin/orders,
 * …) — but /admin/login sits outside this layout and stays reachable.
 *
 * Why this exists on top of proxy.ts: middleware/proxy bypass is a recurring
 * Next.js advisory class, and all but one admin page is a client component that
 * previously rendered its privileged shell (order tables, customer PII layout,
 * settings forms) before any authorization answer came back. This makes the
 * session check part of the render path, so a bypassed proxy yields a redirect
 * instead of an admin UI.
 */
export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user) {
    redirect("/admin/login");
  }

  if (!isAdminRole(role)) {
    logSecurityEvent("authz.denied", {
      actor: maskEmail((session.user as { email?: string }).email),
      action: "admin_dashboard",
      reason: "insufficient_role",
    });
    redirect("/admin/login");
  }

  return <>{children}</>;
}
