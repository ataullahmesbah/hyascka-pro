import { Panel } from "@/components/dashboard/page-shell";
import { SeoForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SeoSettingsPage() {
  const { seo } = await getSettings();
  return (
    <Panel title="SEO defaults" description="Used wherever a page does not set its own title or description.">
      <SeoForm values={seo as unknown as Record<string, string>} />
    </Panel>
  );
}
