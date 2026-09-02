import { Panel } from "@/components/dashboard/page-shell";
import { LocalizationForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LocalizationSettingsPage() {
  const { localization } = await getSettings();

  return (
    <Panel
      title="Localization"
      description="The site sells internationally and quotes in US dollars by default. Switch to another currency if that suits your market better."
    >
      <LocalizationForm values={localization as unknown as Record<string, string>} />
    </Panel>
  );
}
