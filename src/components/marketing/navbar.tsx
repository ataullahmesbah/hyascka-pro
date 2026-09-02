"use client";

import * as React from "react";
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
  const [open, setOpen] = React.useState(false);
  const [servicesOpen, setServicesOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
          : "border-transparent bg-transparent",
      )}
    >
      <nav className="container flex h-[var(--header-height)] items-center justify-between gap-4" aria-label="Main">
        <Logo siteName={siteName} />

        <div className="hidden items-center gap-1 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              aria-expanded={servicesOpen}
              aria-haspopup="true"
              onClick={() => setServicesOpen((value) => !value)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted",
                isActive("/services") && "text-primary",
              )}
            >
              Services
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", servicesOpen && "rotate-180")} />
            </button>

            {servicesOpen ? (
              <div className="absolute left-1/2 top-full w-[min(46rem,90vw)] -translate-x-1/2 pt-2">
                <div className="animate-scale-in rounded-2xl border border-border bg-card p-3 shadow-elevated">
                  <div className="grid gap-1 sm:grid-cols-2">
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
                      >
                        <IconBadge name={service.icon} size="sm" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{service.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {service.tagline}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/services"
                    className="mt-2 flex items-center justify-center rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-muted"
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
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted",
                  isActive(link.href) && "text-primary",
                )}
              >
                {link.label}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:block" />
          {/* Visually distinct outline login button (PRD §39.6) */}
          <ButtonLink href="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
            Client Login
          </ButtonLink>
          <ButtonLink href="/contact" size="sm" className="hidden lg:inline-flex">
            Start a project
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-40 animate-fade-in overflow-y-auto border-t border-border bg-background lg:hidden"
        >
          <div className="container flex flex-col gap-1 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-4 py-3.5 text-base font-medium transition-colors hover:bg-muted",
                  isActive(link.href) && "bg-primary-soft text-primary",
                )}
              >
                {link.label}
              </Link>
            ))}

            <p className="mt-4 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Services
            </p>
            <div className="grid gap-1">
              {services.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted"
                >
                  <IconBadge name={service.icon} size="sm" />
                  <span className="text-sm font-medium">{service.title}</span>
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href="/contact" size="lg">
                Start a project
              </ButtonLink>
              <ButtonLink href="/login" variant="outline" size="lg">
                Client Login
              </ButtonLink>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Appearance</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
