import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ProfileForm } from "@/components/dashboard/account-forms";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { ROLE_LABELS } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    include: { clientProfile: true },
  });

  return (
    <>
      <DashboardHeader title="Profile" description="Your details, and the billing information used on invoices." />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <Panel title="Your details">
          <ProfileForm
            isClient={user.role === "CLIENT"}
            values={{
              name: record?.name ?? "",
              phone: record?.phone ?? "",
              companyName: record?.clientProfile?.companyName ?? "",
              billingEmail: record?.clientProfile?.billingEmail ?? "",
              billingPhone: record?.clientProfile?.billingPhone ?? "",
              addressLine1: record?.clientProfile?.addressLine1 ?? "",
              city: record?.clientProfile?.city ?? "",
              country: record?.clientProfile?.country ?? "",
              taxId: record?.clientProfile?.taxId ?? "",
            }}
          />
        </Panel>

        <aside className="space-y-5">
          <Panel title="Account">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Email</dt>
                <dd>{record?.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Role</dt>
                <dd>
                  <Badge tone="accent">{ROLE_LABELS[user.role]}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Email verified</dt>
                <dd>
                  {record?.emailVerifiedAt ? (
                    formatDate(record.emailVerifiedAt)
                  ) : (
                    <Badge tone="warning">Not verified</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Member since</dt>
                <dd>{formatDate(record?.createdAt)}</dd>
              </div>
              {record?.clientProfile?.referralCode ? (
                <div>
                  <dt className="text-xs text-ink-muted">Referral code</dt>
                  <dd className="font-mono">{record.clientProfile.referralCode}</dd>
                </div>
              ) : null}
            </dl>
          </Panel>
        </aside>
      </div>
    </>
  );
}
