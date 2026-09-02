import Link from "next/link";
import { Check } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { getSettings } from "@/lib/settings";

const ASSURANCES = [
  "Projects, invoices and payments in one place",
  "Every action permission-checked server-side",
  "Sessions you can review and revoke yourself",
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { brand, contact } = await getSettings();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel — hidden on mobile so the form is the first thing seen. */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface-2/60 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -left-24 top-10 h-96 w-96 rounded-full bg-accent/20 blur-[120px]"
          aria-hidden
        />
        <div className="relative">
          <Logo siteName={brand.siteName} tagline={brand.tagline} />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight">
            The client portal, not a monthly PDF.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            {brand.description}
          </p>
          <ul className="mt-7 space-y-3">
            {ASSURANCES.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-ink-muted">
                <Check className="h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-muted">
          Need help signing in?{" "}
          <a href={`mailto:${contact.supportEmail}`} className="text-accent hover:underline">
            {contact.supportEmail}
          </a>
        </p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo siteName={brand.siteName} />
          </div>
          {children}
          <p className="mt-10 text-center text-xs text-ink-muted">
            <Link href="/" className="hover:text-ink">
              ← Back to hyascka.com
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
