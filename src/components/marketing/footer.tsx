import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { CookieSettingsButton } from "@/components/marketing/cookie-consent";
import type { SiteSettings } from "@/lib/settings";
import type { NavItemSeed } from "@/content/types";

export function Footer({
  settings,
  navigation,
  newsletterEnabled,
}: {
  settings: SiteSettings;
  navigation: NavItemSeed[];
  newsletterEnabled: boolean;
}) {
  const group = (location: string) =>
    navigation.filter((item) => item.location === location).sort((a, b) => a.position - b.position);

  const { brand, contact, social } = settings;

  return (
    <footer className="relative mt-24 border-t border-border bg-surface-2/60">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo siteName={brand.siteName} tagline={brand.tagline} />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {brand.description}
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {contact.addressLine}, {contact.city}, {contact.country}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-foreground">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-foreground">
                  {contact.phone}
                </a>
              </li>
            </ul>

            <div className="mt-6 flex gap-2">
              {social.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Services" items={group("FOOTER_SERVICES")} />
          <FooterColumn title="Company" items={group("FOOTER_COMPANY")} />

          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Legal</h2>
            <ul className="mt-4 space-y-2.5">
              {group("FOOTER_LEGAL").map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {newsletterEnabled ? (
              <div className="mt-8">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Newsletter</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Practical notes on performance, search and building web platforms. Monthly, no filler.
                </p>
                <NewsletterForm className="mt-3" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {brand.siteName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>{contact.hours}</span>
            <CookieSettingsButton />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: NavItemSeed[] }) {
  return (
    <div>
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={`${item.location}-${item.href}`}>
            <Link
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
