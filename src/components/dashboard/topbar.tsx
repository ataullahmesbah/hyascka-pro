"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, User } from "lucide-react";

import { cn, initials, relativeTime } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme";
import { logoutAction } from "@/actions/auth";

export type NotificationPreview = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export function Topbar({
  name,
  email,
  roleLabel,
  unread,
  notifications,
  onOpenNav,
}: {
  name: string;
  email: string;
  roleLabel: string;
  unread: number;
  notifications: NotificationPreview[];
  onOpenNav: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl md:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">Welcome back, {name.split(" ")[0]}</p>
        <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
      </div>

      <ThemeToggle />
      <NotificationBell unread={unread} notifications={notifications} />
      <ProfileMenu name={name} email={email} roleLabel={roleLabel} />
    </header>
  );
}

function useDismiss(onDismiss: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onDismiss();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onDismiss]);
  return ref;
}

/** Bell with unread badge and recent dropdown (PRD §16). */
function NotificationBell({
  unread,
  notifications,
}: {
  unread: number;
  notifications: NotificationPreview[];
}) {
  const [open, setOpen] = React.useState(false);
  const ref = useDismiss(React.useCallback(() => setOpen(false), []));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 ? (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                {unread} unread
              </span>
            ) : null}
          </div>

          <div className="scrollbar-thin max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing new right now.
              </p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={`/dashboard/notifications/${notification.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b border-border/70 px-4 py-3 transition-colors last:border-0 hover:bg-muted/60",
                    !notification.read && "bg-primary-soft/40",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.body}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {relativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-muted"
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ProfileMenu({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = useDismiss(React.useCallback(() => setOpen(false), []));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Account menu"
        className="brand-gradient inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
      >
        {initials(name)}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 animate-scale-in overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
            <p className="mt-1.5 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
              {roleLabel}
            </p>
          </div>
          <div className="p-1.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              Profile
            </Link>
            <Link
              href="/dashboard/security"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              Security
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
