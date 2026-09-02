import { Panel } from "@/components/dashboard/page-shell";
import { TrackingForm } from "@/components/dashboard/settings-forms";
import { getServerTrackingConfig, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function TrackingSettingsPage() {
  const [{ tracking }, serverConfig] = await Promise.all([getSettings(), getServerTrackingConfig()]);

  return (
    <Panel
      title="Tracking & analytics"
      description="IDs only — there is no field anywhere that accepts a raw script tag."
    >
      <TrackingForm
        values={{
          ...(tracking as unknown as Record<string, string>),
          metaDatasetId: serverConfig?.metaDatasetId ?? "",
        }}
        hasCapiToken={Boolean(serverConfig?.metaCapiToken)}
      />
    </Panel>
  );
}
