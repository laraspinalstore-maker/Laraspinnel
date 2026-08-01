import type { Metadata } from "next";
import "../globals.css";
import { buildMetadata } from "@/lib/seo/metadata";

// Static metadata — no per-navigation DB call. Admin pages sit behind auth and
// must never be indexed, so noindex/nofollow, and `path: null` so no canonical
// is emitted for a URL that should not be in the index at all.
// next.config.ts additionally sends X-Robots-Tag: noindex, nofollow, noarchive
// on /admin/:path* as defence in depth.
export const metadata: Metadata = buildMetadata({
  title: "Admin",
  description: "Lara's Pinnal admin dashboard.",
  path: null,
  robots: "noindex-nofollow",
});

import { Providers } from "@/components/Providers";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminSidebarProvider } from "@/components/admin/AdminSidebarContext";
import { ToastProvider } from "@/components/admin/Toast";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminSidebarProvider>
      <div className="fixed inset-0 flex overflow-hidden bg-brand-light-gray/20">
        <AdminSidebar />
        <div className="flex-1 overflow-y-auto w-full relative flex flex-col">
          <Providers>
            <ToastProvider>{children}</ToastProvider>
          </Providers>
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
