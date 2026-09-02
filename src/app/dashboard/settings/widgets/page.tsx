import { Panel } from "@/components/dashboard/page-shell";
import { AssistantForm, WhatsappForm } from "@/components/dashboard/settings-forms";
import { getSettings } from "@/lib/settings";
import { isAssistantConfigured } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

export default async function WidgetSettingsPage() {
  const { whatsapp, assistant, contact, featureFlags } = await getSettings();
  const geminiReady = isAssistantConfigured();

  return (
    <div className="space-y-5">
      <Panel
        title="WhatsApp button"
        description="A floating chat button on every public page. Show or hide it under Settings → Features."
      >
        {!contact.whatsapp ? (
          <p className="mb-4 rounded-lg border border-warning/40 bg-warning-soft p-3 text-step--1 text-warning">
            No WhatsApp number is set. Add one under Settings → Contact, or the button stays hidden.
          </p>
        ) : (
          <p className="mb-4 text-step--2 text-ink-muted">
            Currently messaging <strong className="text-ink">{contact.whatsapp}</strong>. Change the
            number under Settings → Contact.
          </p>
        )}
        <WhatsappForm values={whatsapp as unknown as Record<string, string>} />
      </Panel>

      <Panel
        title="AI assistant"
        description="Answers visitors from your published services, pricing, case studies, FAQs and blog. It has no access to accounts, invoices or any customer record."
      >
        {!geminiReady ? (
          <p className="mb-4 rounded-lg border border-warning/40 bg-warning-soft p-3 text-step--1 text-warning">
            <strong>GEMINI_API_KEY is not set.</strong> The assistant stays hidden until it is. Get a
            free key at aistudio.google.com/apikey and add it to your environment variables.
          </p>
        ) : (
          <p className="mb-4 rounded-lg border border-success/40 bg-success-soft p-3 text-step--1 text-success">
            Gemini is connected. The assistant answers from published content only.
          </p>
        )}
        {!featureFlags.ai_assistant ? (
          <p className="mb-4 text-step--2 text-ink-muted">
            The assistant is switched off under Settings → Features.
          </p>
        ) : null}
        <AssistantForm
          values={{
            name: assistant.name,
            greeting: assistant.greeting,
            suggestions: assistant.suggestions.join("\n"),
          }}
        />
      </Panel>
    </div>
  );
}
