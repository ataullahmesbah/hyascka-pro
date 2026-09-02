import type { Metadata } from "next";
import { Wrench } from "lucide-react";

import { LogoMark } from "@/components/ui/logo";
import { MaintenanceCountdown } from "@/components/marketing/maintenance-countdown";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Scheduled maintenance",
    description: "HYASCKA is briefly offline for a scheduled update.",
    path: "/maintenance",
    noIndex: true,
  });
}

/** Branded maintenance page — never a generic unstyled message (PRD §45.1). */
export default async function MaintenancePage() {
  const { maintenance, contact, brand } = await getSettings();

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
        aria-hidden
      />
      <div className="relative max-w-xl text-center">
        <LogoMark size={64} className="mx-auto" />
        <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/12 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
          <Wrench className="h-3.5 w-3.5" />
          Scheduled maintenance
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">
          {brand.siteName} is briefly offline
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {maintenance.bannerText ||
            "We are shipping an update. The site will be back shortly — nothing you have with us is affected."}
        </p>

        {maintenance.endAt ? <MaintenanceCountdown endAt={maintenance.endAt} /> : null}

        <p className="mt-8 text-sm text-muted-foreground">
          Something urgent?{" "}
          <a href={`mailto:${contact.supportEmail}`} className="text-primary underline-offset-4 hover:underline">
            {contact.supportEmail}
          </a>
        </p>
      </div>
    </main>
  );
}
