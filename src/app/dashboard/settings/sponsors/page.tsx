import { Panel } from "@/components/dashboard/page-shell";
import { SponsorsForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SponsorSettingsPage() {
  const { sponsors, featureFlags } = await getSettings();

  return (
    <div className="space-y-5">
      {!featureFlags.sponsors_marquee ? (
        <div className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-step--1 text-warning">
          The sponsor strip is currently hidden. Turn it on under Settings → Features.
        </div>
      ) : null}

      <Panel
        title="Sponsor & partner strip"
        description="A continuous marquee on the homepage. Each entry shows a logo, or its name as text when no logo is set."
      >
        <SponsorsForm content={sponsors} />
      </Panel>
    </div>
  );
}
