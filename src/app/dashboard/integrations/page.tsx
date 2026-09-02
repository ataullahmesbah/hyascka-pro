import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { IntegrationToggle } from "@/components/dashboard/settings-forms";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/** Which env var backs each integration, so setup is self-documenting. */
const ENV_HINTS: Record<string, string> = {
  resend: "RESEND_API_KEY",
  telegram: "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID",
  cloudinary: "CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET",
  upstash: "UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
  qstash: "QSTASH_TOKEN",
  sentry: "SENTRY_DSN",
  ga4: "Settings → Tracking",
  meta_capi: "META_CAPI_ACCESS_TOKEN (server-side only)",
};

export default async function IntegrationsPage() {
  await requirePermission("integrations.manage");
  const integrations = await prisma.integration.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  const grouped = integrations.reduce<Record<string, typeof integrations>>((acc, integration) => {
    (acc[integration.category] ??= []).push(integration);
    return acc;
  }, {});

  return (
    <>
      <DashboardHeader
        title="Integrations"
        description="Provider adapters. Business logic calls an interface, so swapping a provider never means rewriting domain code."
      />

      <div className="space-y-5">
        {Object.entries(grouped).map(([category, items]) => (
          <Panel key={category} title={category}>
            <ul className="divide-y divide-border">
              {items.map((integration) => (
                <li key={integration.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{integration.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Configured via{" "}
                      <code className="rounded bg-muted px-1 py-0.5">
                        {ENV_HINTS[integration.key] ?? "environment variables"}
                      </code>
                    </p>
                  </div>
                  <IntegrationToggle integrationKey={integration.key} enabled={integration.isEnabled} />
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      <p className="mt-6 rounded-xl border border-border bg-surface-2/60 p-4 text-sm text-muted-foreground">
        Secrets are never entered or displayed here. They live in environment variables on the server,
        so they can never reach the browser bundle.
      </p>
    </>
  );
}
