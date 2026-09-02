import { Panel } from "@/components/dashboard/page-shell";
import {
  AssistantForm,
  FeatureFlagToggle,
  WhatsappForm,
} from "@/components/dashboard/settings-forms";
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
        description="A floating chat button on every public page."
      >
        {/* On/off lives here as well as under Features, because this is the
            page an admin opens when they want to turn the button off. */}
        <div className="mb-5 rounded-lg border border-line p-4">
          <FeatureFlagToggle
            flagKey="whatsapp_widget"
            enabled={Boolean(featureFlags.whatsapp_widget)}
            description="Show the WhatsApp button on the public site"
          />
        </div>

        {!contact.whatsapp ? (
          <p className="mb-4 rounded-lg border border-warning/40 bg-warning-soft p-3 text-step--1 text-warning">
            No number yet — add one below and the button starts working.
          </p>
        ) : null}
        <WhatsappForm
          values={{
            ...(whatsapp as unknown as Record<string, string>),
            phone: contact.whatsapp,
          }}
        />
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
        <div className="mb-5 rounded-lg border border-line p-4">
          <FeatureFlagToggle
            flagKey="ai_assistant"
            enabled={Boolean(featureFlags.ai_assistant)}
            description="Show the AI assistant on the public site"
          />
        </div>
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
