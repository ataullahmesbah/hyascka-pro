import { Panel } from "@/components/dashboard/page-shell";
import { MaintenanceForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function MaintenanceSettingsPage() {
  const { maintenance } = await getSettings();
  return (
    <Panel
      title="Maintenance"
      description="Two stages: warn visitors in advance, then take the site offline only when the work actually starts."
    >
      <MaintenanceForm values={maintenance as unknown as Record<string, unknown>} />
    </Panel>
  );
}
