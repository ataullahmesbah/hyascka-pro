"use client";

import * as React from "react";

import { Sidebar, type SidebarUser } from "@/components/dashboard/sidebar";
import { Topbar, type NotificationPreview } from "@/components/dashboard/topbar";
import type { NavLink } from "@/lib/rbac";

const COLLAPSE_KEY = "hyascka.sidebarCollapsed";

export function DashboardShell({
  navigation,
  user,
  siteName,
  unread,
  notifications,
  children,
}: {
  navigation: NavLink[];
  user: SidebarUser;
  siteName: string;
  unread: number;
  notifications: NotificationPreview[];
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  // Collapse preference is per device, so it survives navigation and reloads.
  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* private mode */
    }
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  return (
    <div className="flex min-h-dvh bg-bg-subtle">
      <Sidebar
        navigation={navigation}
        user={user}
        siteName={siteName}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={user.name}
          email={user.email}
          roleLabel={user.roleLabel}
          unread={unread}
          notifications={notifications}
          onOpenNav={() => setNavOpen(true)}
        />
        <main id="main" className="flex-1 p-4 md:p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
