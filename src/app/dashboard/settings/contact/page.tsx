import { Panel } from "@/components/dashboard/page-shell";
import { ContactForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ContactSettingsPage() {
  const { contact } = await getSettings();
  return (
    <Panel title="Contact details" description="Shown in the footer, on the contact page and in transactional emails.">
      <ContactForm values={contact as unknown as Record<string, string>} />
    </Panel>
  );
}
