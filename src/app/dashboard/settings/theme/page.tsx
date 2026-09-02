import { Panel } from "@/components/dashboard/page-shell";
import { ThemeSettingsForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";
import { resolveThemePolicy } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage() {
  const { theme } = await getSettings();
  const policy = resolveThemePolicy(theme);

  return (
    <Panel
      title="Theme"
      description="Three themes ship with the site. Choose what visitors see by default, which alternatives they may switch to, and whether they may switch at all."
    >
      <ThemeSettingsForm policy={policy} />
    </Panel>
  );
}
