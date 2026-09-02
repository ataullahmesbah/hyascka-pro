import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ArchiveButton, DeleteButton, FaqForm, RestoreButton } from "@/components/dashboard/content-forms";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function FaqAdminPage() {
  await requirePermission("content.manage");
  const faqs = await prisma.fAQ.findMany({ orderBy: [{ category: "asc" }, { position: "asc" }] });

  return (
    <>
      <DashboardHeader
        title="FAQ"
        description="Answers shown on the FAQ page, the homepage and, as structured data, in search results."
        breadcrumbs={[{ label: "Content" }, { label: "FAQ" }]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-5">
          {faqs.length ? (
            faqs.map((faq) => (
              <Panel
                key={faq.id}
                title={faq.question}
                description={faq.category}
                action={
                  <div className="flex items-center gap-2">
                    <StatusBadge status={faq.status} />
                    {faq.status !== "ARCHIVED" ? (
                        <ArchiveButton entity="faq" id={faq.id} />
                      ) : (
                        <div className="flex gap-2">
                          <RestoreButton entity="faq" id={faq.id} />
                          <DeleteButton entity="faq" id={faq.id} />
                        </div>
                      )}
                  </div>
                }
              >
                <FaqForm
                  draft={{
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    status: faq.status,
                  }}
                />
              </Panel>
            ))
          ) : (
            <EmptyState icon="HelpCircle" title="No FAQ entries yet" />
          )}
        </div>

        <Panel title="Add a question">
          <FaqForm />
        </Panel>
      </div>
    </>
  );
}
