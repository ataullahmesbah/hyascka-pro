import { Panel } from "@/components/dashboard/page-shell";
import { FontSettingsForm, ThemeSettingsForm } from "@/components/dashboard/settings-forms";
import { resolveFontPolicy } from "@/lib/fonts";
import { getSettings } from "@/lib/settings";
import { resolveThemePolicy } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ThemeSettingsPage() {
  const { theme, fonts } = await getSettings();
  const policy = resolveThemePolicy(theme);
  const fontPolicy = resolveFontPolicy(fonts);

  return (
    <div className="space-y-6">
      <Panel
        title="Theme"
        description="Three themes ship with the site. Choose what visitors see by default, which alternatives they may switch to, and whether they may switch at all."
      >
        <ThemeSettingsForm policy={policy} />
      </Panel>

      <Panel
        title="Typography"
        description="Five typefaces ship with the site. Pick one for headings and one for body copy — the change is live everywhere as soon as you save."
      >
        <FontSettingsForm policy={fontPolicy} />
      </Panel>
    </div>
  );
}
