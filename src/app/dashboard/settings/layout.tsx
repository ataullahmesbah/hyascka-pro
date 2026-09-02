import Link from "next/link";

import { DashboardHeader } from "@/components/dashboard/page-shell";
import { requirePermission } from "@/lib/auth/guards";

const TABS = [
  { href: "/dashboard/settings", label: "Brand" },
  { href: "/dashboard/settings/theme", label: "Theme & fonts" },
  { href: "/dashboard/settings/localization", label: "Currency" },
  { href: "/dashboard/settings/contact", label: "Contact" },
  { href: "/dashboard/settings/sponsors", label: "Sponsors" },
  { href: "/dashboard/settings/widgets", label: "Chat & WhatsApp" },
  { href: "/dashboard/settings/payments", label: "Payments" },
  { href: "/dashboard/settings/tracking", label: "Tracking" },
  { href: "/dashboard/settings/seo", label: "SEO" },
  { href: "/dashboard/settings/maintenance", label: "Maintenance" },
  { href: "/dashboard/settings/features", label: "Features" },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  // Guarded once for the whole section; each action re-checks independently.
  await requirePermission("settings.manage");

  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Everything a non-developer needs to operate the platform. Every field here is a validated form — never code."
      />

      <nav className="scrollbar-thin mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Settings sections">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </>
  );
}
