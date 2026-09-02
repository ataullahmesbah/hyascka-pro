"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, LogOut, Menu, User } from "lucide-react";

import { cn, initials, relativeTime } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme";
import { logoutAction } from "@/actions/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications";

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
    <header className="sticky top-0 z-header flex h-[var(--header-h)] items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-xl md:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="rounded-btn border border-line-strong p-2 text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
      >
        <Menu className="h-[1.1rem] w-[1.1rem]" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-step--1 font-semibold text-ink">
          Welcome back, {name.split(" ")[0]}
        </p>
        <p className="truncate text-step--2 text-ink-muted">{roleLabel}</p>
      </div>

      <ThemeToggle />
      <NotificationBell initialUnread={unread} initialItems={notifications} />
      <ProfileMenu name={name} email={email} roleLabel={roleLabel} />
    </header>
  );
}

function useDismiss(onDismiss: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onDismiss();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onDismiss]);
  return ref;
}

/**
 * Notification bell (PRD §6.9).
 *
 * The badge is client state seeded from the server, so marking something read
 * updates the count immediately instead of waiting for a navigation — which is
 * the bug that made the bell feel dead in v4.
 */
function NotificationBell({
  initialUnread,
  initialItems,
}: {
  initialUnread: number;
  initialItems: NotificationPreview[];
}) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState(initialItems);
  const [unread, setUnread] = React.useState(initialUnread);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();
  const ref = useDismiss(React.useCallback(() => setOpen(false), []));

  // Re-sync when the server sends fresh props after a route change.
  React.useEffect(() => {
    setItems(initialItems);
    setUnread(initialUnread);
  }, [initialItems, initialUnread]);

  const openItem = (item: NotificationPreview) => {
    if (!item.read) {
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
      setUnread((count) => Math.max(0, count - 1));
      startTransition(async () => {
        await markNotificationRead(item.id);
      });
    }
    setOpen(false);
    // Always open the notification itself rather than jumping straight to the
    // record it refers to. The linked page is permission-gated, so for a role
    // that cannot open it the jump ended on "access denied" instead of showing
    // the message; the detail page shows the message to everyone and offers the
    // onward link to whoever may follow it.
    router.push(`/dashboard/notifications/${item.id}`);
  };

  const markAll = () => {
    setItems((current) => current.map((i) => ({ ...i, read: true })));
    setUnread(0);
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-btn border border-line-strong text-ink-soft transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
      >
        <Bell className="h-[1.05rem] w-[1.05rem]" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-pill bg-danger px-1 text-[0.65rem] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-modal mt-2 w-[min(22rem,calc(100vw-2rem))] animate-scale-in overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-step--1 font-semibold text-ink">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-btn px-2 py-1 text-step--2 font-semibold text-accent transition-colors hover:bg-accent-soft disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                Mark all read
              </button>
            ) : (
              <span className="text-step--2 text-ink-muted">All caught up</span>
            )}
          </div>

          <div className="scrollbar-thin max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-step--1 text-ink-muted">
                Nothing new right now.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-2",
                    !item.read && "bg-accent-soft/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-pill",
                      item.read ? "bg-transparent" : "bg-accent",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-step--1 font-medium text-ink">{item.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-step--2 text-ink-muted">{item.body}</span>
                    <span className="mt-1 block text-step--2 text-ink-muted">
                      {relativeTime(item.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-step--1 font-semibold text-accent transition-colors hover:bg-surface-2"
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
        aria-haspopup="menu"
        aria-label="Account menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-pill bg-accent-soft text-step--2 font-bold text-accent transition-colors hover:bg-accent hover:text-accent-ink"
      >
        {initials(name)}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-modal mt-2 w-60 animate-scale-in overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-step--1 font-semibold text-ink">{name}</p>
            <p className="truncate text-step--2 text-ink-muted">{email}</p>
            <span className="mt-1.5 inline-block rounded-pill bg-accent-soft px-2 py-0.5 text-step--2 font-semibold text-accent">
              {roleLabel}
            </span>
          </div>
          <div className="p-1.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-step--1 transition-colors hover:bg-surface-2"
            >
              <User className="h-4 w-4 text-ink-muted" />
              Profile
            </Link>
            <Link
              href="/dashboard/security"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-btn px-3 py-2 text-step--1 transition-colors hover:bg-surface-2"
            >
              <Bell className="h-4 w-4 text-ink-muted" />
              Security
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-step--1 text-danger transition-colors hover:bg-danger-soft"
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
