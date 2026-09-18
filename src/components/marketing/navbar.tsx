"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme";
import { IconBadge } from "@/components/ui/icon";

export type NavService = { slug: string; title: string; tagline: string; icon: string };
export type NavLinkItem = { label: string; href: string };

/**
 * The public navigation bar.
 *
 * Two things the previous version got wrong and this one fixes:
 *  1. It was transparent over content, so text slid underneath while scrolling.
 *     The bar now always occupies layout space and gains an opaque, bordered
 *     surface the moment the page moves.
 *  2. Its dropdown and mobile menu depended on hover alone. Everything here is
 *     click-driven, keyboard-reachable, closes on Escape/outside-click/route
 *     change, and the mobile drawer traps focus and locks body scroll.
 */
export function Navbar({
  links,
  services,
  siteName,
}: {
  links: NavLinkItem[];
  services: NavService[];
  siteName: string;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const servicesRef = React.useRef<HTMLDivElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  // The drawer is portalled, so it may only render once there is a document.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Any navigation closes everything.
  React.useEffect(() => {
    setDrawerOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  // Desktop dropdown: outside click + Escape.
  React.useEffect(() => {
    if (!servicesOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setServicesOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [servicesOpen]);

  // Mobile drawer: lock scroll, trap focus, restore focus on close.
  React.useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const node = drawerRef.current;
    // Captured now so the cleanup restores focus to the element that opened the
    // drawer, not to whatever the ref points at later.
    const opener = triggerRef.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [drawerOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-header w-full border-b transition-[height,background-color,border-color,box-shadow] duration-200",
        scrolled
          ? "h-[var(--header-h-scrolled)] border-line bg-bg/85 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-bg/75"
          : "h-[var(--header-h)] border-transparent bg-bg",
      )}
    >
      <nav className="container-x flex h-full items-center justify-between gap-3" aria-label="Main">
        <Logo siteName={siteName} size={30} />

        {/* ---- Desktop links ---- */}
        <div className="hidden items-center gap-0.5 lg:flex">
          <div ref={servicesRef} className="relative">
            <button
              type="button"
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              onClick={() => setServicesOpen((value) => !value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-btn px-3 py-2 text-step--1 font-medium transition-colors duration-fast hover:bg-surface-2",
                isActive("/services") ? "text-accent" : "text-ink-soft hover:text-ink",
              )}
            >
              Services
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform duration-fast", servicesOpen && "rotate-180")}
              />
            </button>

            {servicesOpen ? (
              <div className="absolute left-1/2 top-full w-[min(44rem,88vw)] -translate-x-1/2 pt-2">
                <div className="animate-scale-in rounded-xl border border-line bg-surface p-2.5 shadow-lg">
                  <div className="grid gap-0.5 sm:grid-cols-2">
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        className="flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-fast hover:bg-surface-2"
                      >
                        <IconBadge name={service.icon} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-step--1 font-semibold text-ink">{service.title}</span>
                          <span className="mt-0.5 block truncate text-step--2 text-ink-muted">
                            {service.tagline}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/services"
                    className="mt-2 flex items-center justify-center rounded-lg bg-surface-2 px-4 py-2 text-step--1 font-semibold text-accent transition-colors duration-fast hover:bg-surface-3"
                  >
                    View all services
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {links
            .filter((link) => link.href !== "/services")
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-btn px-3 py-2 text-step--1 font-medium transition-colors duration-fast hover:bg-surface-2",
                  isActive(link.href) ? "text-accent" : "text-ink-soft hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
        </div>

        {/* ---- Actions ---- */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Both render; the pre-paint script decides which one is shown, so
              the markup stays static and there is no flash of the wrong one. */}
          <div className="hidden sm:block">
            <ButtonLink href="/login" variant="outline" size="sm" data-auth-out="">
              Sign in
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="outline" size="sm" data-auth-in="">
              Dashboard
            </ButtonLink>
          </div>
          <ButtonLink href="/contact" size="sm" className="hidden lg:inline-flex">
            Get a quote
          </ButtonLink>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-line-strong text-ink-soft transition-colors duration-fast hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Menu className="h-[1.1rem] w-[1.1rem]" />
          </button>
        </div>
      </nav>

      {/*
        ---- Mobile / tablet drawer ----

        Portalled to <body> rather than left inside <header>. Once the page
        scrolls, the header gains `backdrop-blur-xl`, and an element with a
        backdrop-filter becomes the containing block for its `position: fixed`
        descendants. The drawer was therefore laid out against a 60px-tall
        header instead of the viewport: it opened correctly at the top of a
        page and collapsed to a sliver everywhere else.
      */}
      {drawerOpen && mounted
        ? createPortal(
          <div className="lg:hidden">
            <div
              className="fixed inset-0 z-drawer bg-[hsl(var(--overlay))] backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <div
              ref={drawerRef}
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="fixed inset-y-0 right-0 z-drawer flex w-[min(22rem,88vw)] flex-col border-l border-line bg-bg shadow-lg"
            >
              <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line px-5">
                <Logo siteName={siteName} size={28} />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-line-strong text-ink-soft transition-colors duration-fast hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-[1.1rem] w-[1.1rem]" />
                </button>
              </div>

              <div className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                <nav aria-label="Mobile">
                  <ul className="space-y-0.5">
                    {links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            "block rounded-lg px-3.5 py-3 text-step-0 font-medium transition-colors duration-fast hover:bg-surface-2",
                            isActive(link.href) ? "bg-accent-soft text-accent" : "text-ink",
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <MobileSection title="Services">
                    <ul className="space-y-0.5">
                      {services.map((service) => (
                        <li key={service.slug}>
                          <Link
                            href={`/services/${service.slug}`}
                            className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-colors duration-fast hover:bg-surface-2"
                          >
                            <IconBadge name={service.icon} size="xs" />
                            <span className="text-step--1 font-medium text-ink">{service.title}</span>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href="/services"
                          className="block rounded-lg px-3.5 py-2.5 text-step--1 font-semibold text-accent transition-colors duration-fast hover:bg-surface-2"
                        >
                          View all services →
                        </Link>
                      </li>
                    </ul>
                  </MobileSection>
                </nav>
              </div>

              <div className="shrink-0 space-y-3 border-t border-line p-4">
                <ButtonLink href="/contact" size="lg" className="w-full">
                  Get a quote
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  variant="outline"
                  size="lg"
                  data-auth-out=""
                  className="w-full"
                >
                  Sign in
                </ButtonLink>
                <ButtonLink
                  href="/dashboard"
                  variant="outline"
                  size="lg"
                  data-auth-in=""
                  className="w-full justify-center"
                >
                  Dashboard
                </ButtonLink>
                <div className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5">
                  <span className="text-step--1 text-ink-soft">Appearance</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </header>
  );
}

/** Collapsible group inside the drawer — open by default so nothing is hidden. */
function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="mt-5 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3.5 py-1.5 text-step--2 font-semibold uppercase tracking-wide text-ink-muted"
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-fast", open && "rotate-180")} />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="mt-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
