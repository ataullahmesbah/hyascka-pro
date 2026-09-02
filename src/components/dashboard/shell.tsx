"use client";

import * as React from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar, type NotificationPreview } from "@/components/dashboard/topbar";
import type { NavLink } from "@/lib/rbac";

export function DashboardShell({
  navigation,
  name,
  email,
  roleLabel,
  siteName,
  unread,
  notifications,
  children,
}: {
  navigation: NavLink[];
  name: string;
  email: string;
  roleLabel: string;
  siteName: string;
  unread: number;
  notifications: NotificationPreview[];
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh bg-surface-2/40">
      <Sidebar
        navigation={navigation}
        roleLabel={roleLabel}
        siteName={siteName}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={name}
          email={email}
          roleLabel={roleLabel}
          unread={unread}
          notifications={notifications}
          onOpenNav={() => setNavOpen(true)}
        />
        <main id="main" className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
