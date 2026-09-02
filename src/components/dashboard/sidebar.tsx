"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, LogOut, PanelLeftClose, X } from "lucide-react";

import { cn, initials } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { logoutAction } from "@/actions/auth";
import type { NavLink } from "@/lib/rbac";

export type SidebarUser = {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string | null;
};

/**
 * Application sidebar (PRD §6.1).
 *
 * A drawer on mobile and tablet, a persistent rail on desktop that can be
 * collapsed. The identity block at the top answers "who am I signed in as and
 * with what role" without opening a menu — the thing the previous version made
 * you hunt for.
 */
export function Sidebar({
  navigation,
  user,
  siteName,
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: {
  navigation: NavLink[];
  user: SidebarUser;
  siteName: string;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();

  const isActive = React.useCallback(
    (href: string) =>
      href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  // Drawer behaves like a dialog on small screens: lock scroll, close on Escape.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-drawer bg-[hsl(var(--overlay))] backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-drawer flex flex-col border-r border-line bg-surface transition-[transform,width] duration-200",
          "lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[17rem] lg:w-[4.5rem]" : "w-[17rem]",
        )}
        aria-label="Dashboard navigation"
      >
        {/* ---- Brand ---- */}
        <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between gap-2 border-b border-line px-4">
          {collapsed ? (
            <Link href="/dashboard" aria-label={`${siteName} dashboard`} className="mx-auto">
              <Logo href="/dashboard" siteName={siteName} wordmark={false} size={28} />
            </Link>
          ) : (
            <Logo href="/dashboard" siteName={siteName} size={28} />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-btn p-1.5 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ---- Identity ---- */}
        <div className={cn("shrink-0 border-b border-line", collapsed ? "px-2 py-3" : "px-4 py-4")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-pill border border-line object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-step--2 font-bold text-accent">
                {initials(user.name)}
              </span>
            )}
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-step--1 font-semibold text-ink">{user.name}</p>
                <p className="truncate text-step--2 text-ink-muted">{user.email}</p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <span className="mt-2.5 inline-flex rounded-pill bg-surface-2 px-2.5 py-0.5 text-step--2 font-semibold text-ink-soft">
              {user.roleLabel}
            </span>
          ) : null}
        </div>

        {/* ---- Navigation ---- */}
        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2.5">
          {navigation.map((item) =>
            item.children?.length ? (
              <NavGroup key={item.href} item={item} isActive={isActive} collapsed={collapsed} />
            ) : (
              <NavItem key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
            ),
          )}
        </nav>

        {/* ---- Footer ---- */}
        <div className="shrink-0 space-y-0.5 border-t border-line p-2.5">
          <Link
            href="/"
            target="_blank"
            title="View website"
            className={cn(
              "flex items-center gap-2.5 rounded-btn px-3 py-2 text-step--1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink",
              collapsed && "justify-center px-0",
            )}
          >
            <ExternalLink className="h-[1.05rem] w-[1.05rem] shrink-0" />
            {!collapsed ? "View website" : null}
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-step--1 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger",
                collapsed && "justify-center px-0",
              )}
            >
              <LogOut className="h-[1.05rem] w-[1.05rem] shrink-0" />
              {!collapsed ? "Sign out" : null}
            </button>
          </form>

          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden w-full items-center gap-2.5 rounded-btn px-3 py-2 text-step--1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink lg:flex",
              collapsed && "justify-center px-0",
            )}
          >
            <PanelLeftClose
              className={cn("h-[1.05rem] w-[1.05rem] shrink-0 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed ? "Collapse" : null}
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: NavLink;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-btn px-3 py-2.5 text-step--1 font-medium transition-colors duration-fast",
        active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon name={item.icon} className="h-[1.05rem] w-[1.05rem] shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

/**
 * Disclosure group. The previous build rendered these but never let them open
 * on a fresh page load, which is why Finance and Content felt broken.
 */
function NavGroup({
  item,
  isActive,
  collapsed,
}: {
  item: NavLink;
  isActive: (href: string) => boolean;
  collapsed: boolean;
}) {
  const childActive = item.children?.some((child) => isActive(child.href)) ?? false;
  const [open, setOpen] = React.useState(childActive);

  React.useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  // Collapsed rail: the group becomes a direct link to its first child.
  if (collapsed) {
    const first = item.children?.[0];
    return (
      <Link
        href={first?.href ?? item.href}
        title={item.label}
        className={cn(
          "flex items-center justify-center rounded-btn py-2.5 transition-colors duration-fast",
          childActive ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
        )}
      >
        <Icon name={item.icon} className="h-[1.05rem] w-[1.05rem]" />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-btn px-3 py-2.5 text-step--1 font-medium transition-colors duration-fast",
          childActive ? "text-accent" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
        )}
      >
        <Icon name={item.icon} className="h-[1.05rem] w-[1.05rem] shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-fast", open && "rotate-180")} />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-[1.35rem] mt-0.5 space-y-0.5 border-l border-line pl-2.5">
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                aria-current={isActive(child.href) ? "page" : undefined}
                className={cn(
                  "block rounded-btn px-3 py-2 text-step--1 transition-colors duration-fast",
                  isActive(child.href)
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
