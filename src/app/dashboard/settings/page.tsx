import { Panel } from "@/components/dashboard/page-shell";
import { BrandForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function BrandSettingsPage() {
  const { brand } = await getSettings();
  return (
    <Panel title="Brand" description="Name, tagline and logo used across the site, emails and social previews.">
      <BrandForm values={brand as unknown as Record<string, string>} />
    </Panel>
  );
}
