import { DashboardHeader, Panel } from "@/components/dashboard/page-shell";
import { ArchiveButton, CaseStudyForm } from "@/components/dashboard/content-forms";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function CaseStudiesAdminPage() {
  await requirePermission("content.manage");
  const studies = await prisma.caseStudy.findMany({ orderBy: { position: "asc" } });

  return (
    <>
      <DashboardHeader
        title="Case studies"
        description="Publish outcomes with evidence. Metrics are edited alongside the story — never invent a number."
        breadcrumbs={[{ label: "Content" }, { label: "Case studies" }]}
      />

      <div className="space-y-5">
        {studies.length ? (
          studies.map((study) => (
            <Panel
              key={study.id}
              title={study.title}
              description={`${study.client} · ${study.industry}`}
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge status={study.status} />
                  {study.status !== "ARCHIVED" ? <ArchiveButton entity="caseStudy" id={study.id} /> : null}
                </div>
              }
            >
              <CaseStudyForm
                draft={{
                  id: study.id,
                  title: study.title,
                  slug: study.slug,
                  client: study.client,
                  industry: study.industry,
                  summary: study.summary,
                  challenge: study.challenge,
                  solution: study.solution,
                  outcome: study.outcome,
                  status: study.status,
                  featured: study.featured,
                }}
              />
            </Panel>
          ))
        ) : (
          <EmptyState icon="Trophy" title="No case studies yet" />
        )}

        <Panel title="Add a case study">
          <CaseStudyForm />
        </Panel>
      </div>
    </>
  );
}
