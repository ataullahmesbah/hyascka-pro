import { Panel } from "@/components/dashboard/page-shell";
import { ThemeForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage() {
  const { theme } = await getSettings();
  return (
    <Panel
      title="Theme"
      description="Two accent identities and three appearance modes — a closed set of safe options, so a change can never break the design system."
    >
      <ThemeForm accent={theme.accent} mode={theme.mode} />
    </Panel>
  );
}
