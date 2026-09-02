import { Panel } from "@/components/dashboard/page-shell";
import { PaymentMethodForm } from "@/components/dashboard/settings-forms";
import { StatusBadge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const METHODS = [
  { key: "BKASH" as const, label: "bKash", gateway: false },
  { key: "NAGAD" as const, label: "Nagad", gateway: false },
  { key: "BANK_TRANSFER" as const, label: "Bank Transfer", gateway: false },
  { key: "SSLCOMMERZ" as const, label: "Card / SSLCommerz", gateway: true },
];

export default async function PaymentSettingsPage() {
  const configs = await prisma.paymentMethodConfig.findMany().catch(() => []);
  const byMethod = new Map(configs.map((config) => [config.method, config]));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface-2/60 p-4 text-sm text-muted-foreground">
        Turning a method off removes it from the client payment screen immediately — no deployment
        needed. Gateway credentials are stored server-side and are never displayed back to you.
      </div>

      {METHODS.map((method) => {
        const config = byMethod.get(method.key);
        return (
          <Panel
            key={method.key}
            title={config?.label ?? method.label}
            action={<StatusBadge status={config?.isActive ? "ACTIVE" : "DISABLED"} />}
          >
            <PaymentMethodForm
              method={method.key}
              isGateway={method.gateway}
              values={{
                label: config?.label ?? method.label,
                isActive: config?.isActive ?? false,
                accountName: config?.accountName ?? "",
                accountNumber: config?.accountNumber ?? "",
                branch: config?.branch ?? "",
                instructions: config?.instructions ?? "",
                minAmount: config?.minAmount ? Number(config.minAmount) : "",
                maxAmount: config?.maxAmount ? Number(config.maxAmount) : "",
                hasCredentials: Boolean(config?.credentials),
              }}
            />
          </Panel>
        );
      })}
    </div>
  );
}
