"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, ChevronDown, Bell, Menu } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import { useAdminSidebar } from "./AdminSidebarContext";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AdminTopbarProps {
  title: string;
}

export default function AdminTopbar({ title }: AdminTopbarProps) {
  const { data: session } = useSession();
  const { isCollapsed } = useAdminSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: messagesData } = useSWR("/api/admin/messages/unread-count", fetcher, {
    refreshInterval: 60000
  });
  const unreadCount = messagesData?.count || 0;

  // position: fixed (not sticky) — pinned to the viewport unconditionally,
  // regardless of any ancestor scroll-container quirks. Its left offset is
  // synced to the sidebar's current width via shared context so it never
  // overlaps it; the spacer div below reserves the equivalent height in
  // normal flow so page content isn't hidden underneath.
  const leftOffsetClass = isCollapsed ? "md:left-16" : "md:left-60";

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 ${leftOffsetClass} bg-white border-b border-brand-border h-16 px-4 md:px-6 flex items-center justify-between z-30 transition-all duration-300`}>
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => window.dispatchEvent(new Event('toggle-admin-sidebar'))}
          className="md:hidden p-2 -ml-2 text-brand-black hover:bg-brand-light-gray rounded-lg"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Title */}
        <h1 className="font-display text-xl md:text-2xl text-brand-black tracking-wide truncate max-w-[200px] md:max-w-none">
          {title}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          href="/admin/messages"
          className="text-brand-gray hover:text-brand-black p-2 rounded-full hover:bg-brand-light-gray relative transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {/* Badge indicator if there are notifications */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-secondary rounded-full ring-2 ring-white text-[9px] text-white font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 text-sm font-medium text-brand-black hover:bg-brand-light-gray px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-brand-border"
          >
            <div className="w-8 h-8 rounded-full bg-primary-tint text-primary-text flex items-center justify-center font-bold">
              {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <span className="hidden sm:inline-block">
              {session?.user?.name || "Admin"}
            </span>
            <ChevronDown size={14} className="text-brand-gray" />
          </button>

          {/* User Menu Dropdown */}
          {dropdownOpen && (
            <>
              {/* Overlay to close on click outside */}
              <div
                onClick={() => setDropdownOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              ></div>

              <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in duration-100">
                <div className="px-4 py-2 border-b border-brand-border">
                  <p className="text-xs text-brand-gray">Signed in as</p>
                  <p className="text-sm font-semibold text-brand-black truncate">
                    {session?.user?.email}
                  </p>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/admin/login" })}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    {/* Spacer — reserves the fixed header's height in normal document flow */}
    <div className="h-16 shrink-0" />
    </>
  );
}
