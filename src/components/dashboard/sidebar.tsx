"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import type { NavLink } from "@/lib/rbac";

/**
 * Per-role sidebar (PRD §42). The tree arrives already filtered by the
 * permission matrix on the server — this component only renders it.
 */
export function Sidebar({
  navigation,
  roleLabel,
  siteName,
  open,
  onClose,
}: {
  navigation: NavLink[];
  roleLabel: string;
  siteName: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-border bg-surface transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Dashboard navigation"
      >
        <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border px-5">
          <Logo href="/dashboard" siteName={siteName} size={30} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {roleLabel} workspace
          </p>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
          {navigation.map((item) =>
            item.children?.length ? (
              <NavGroup key={item.href} item={item} isActive={isActive} />
            ) : (
              <NavItem key={item.href} item={item} active={isActive(item.href)} />
            ),
          )}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon name="ExternalLink" className="h-4 w-4" />
            View website
          </Link>
        </div>
      </aside>
    </>
  );
}

function NavItem({ item, active }: { item: NavLink; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroup({
  item,
  isActive,
}: {
  item: NavLink;
  isActive: (href: string) => boolean;
}) {
  const childActive = item.children?.some((child) => isActive(child.href)) ?? false;
  const [open, setOpen] = React.useState(childActive);

  React.useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          childActive ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              aria-current={isActive(child.href) ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(child.href)
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
