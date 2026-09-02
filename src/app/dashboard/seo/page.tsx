import { DashboardHeader, Panel, StatCard } from "@/components/dashboard/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Flags pages whose metadata is missing or outside the recommended length. */
function assess(title: string | null, description: string | null) {
  if (!title || !description) return { tone: "danger" as const, label: "Missing" };
  if (title.length > 65 || description.length > 165) return { tone: "warning" as const, label: "Too long" };
  if (description.length < 70) return { tone: "warning" as const, label: "Thin" };
  return { tone: "success" as const, label: "Good" };
}

export default async function SeoPage() {
  await requirePermission("seo.manage");

  const [settings, services, posts, caseStudies] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, metaTitle: true, metaDescription: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, metaTitle: true, metaDescription: true },
    }),
    prisma.caseStudy.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true, metaTitle: true, metaDescription: true },
    }),
  ]);

  const rows = [
    ...services.map((row) => ({ ...row, path: `/services/${row.slug}`, type: "Service" })),
    ...caseStudies.map((row) => ({ ...row, path: `/work/${row.slug}`, type: "Case study" })),
    ...posts.map((row) => ({ ...row, path: `/blog/${row.slug}`, type: "Article" })),
  ];

  const issues = rows.filter((row) => assess(row.metaTitle, row.metaDescription).tone !== "success").length;

  return (
    <>
      <DashboardHeader
        title="SEO"
        description="Metadata health across indexable pages. Sitemap and robots are generated automatically from published content."
        actions={
          <>
            <ButtonLink href="/sitemap.xml" variant="outline" size="sm" target="_blank">
              View sitemap
            </ButtonLink>
            <ButtonLink href="/robots.txt" variant="outline" size="sm" target="_blank">
              View robots.txt
            </ButtonLink>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Indexable pages" value={rows.length + 12} icon="Globe" />
        <StatCard label="Metadata issues" value={issues} icon="AlertTriangle" tone={issues ? "warning" : "success"} />
        <StatCard label="Robots directive" value={settings.seo.robots} icon="Bot" tone="info" />
      </div>

      <Panel title="Site defaults" description="Used wherever a page does not set its own metadata." className="mb-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Default title</dt>
            <dd className="text-sm">{settings.seo.defaultTitle}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Title template</dt>
            <dd className="text-sm">{settings.seo.titleTemplate}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Default description</dt>
            <dd className="text-sm">{settings.seo.defaultDescription}</dd>
          </div>
        </dl>
        <ButtonLink href="/dashboard/settings/seo" size="sm" variant="outline" className="mt-5">
          Edit SEO defaults
        </ButtonLink>
      </Panel>

      <Panel title="Page metadata">
        <TableWrap className="border-0">
          <Table className="min-w-[52rem]">
            <thead>
              <tr>
                <Th>Page</Th>
                <Th>Type</Th>
                <Th>Meta title</Th>
                <Th>Meta description</Th>
                <Th>Health</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const health = assess(row.metaTitle, row.metaDescription);
                return (
                  <Tr key={`${row.type}-${row.id}`}>
                    <Td>
                      <a href={row.path} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">
                        {row.title}
                      </a>
                      <p className="text-xs text-muted-foreground">{row.path}</p>
                    </Td>
                    <Td className="text-muted-foreground">{row.type}</Td>
                    <Td className="text-muted-foreground">
                      {row.metaTitle ?? "—"}
                      <span className="block text-[11px]">{row.metaTitle?.length ?? 0} chars</span>
                    </Td>
                    <Td className="max-w-sm text-muted-foreground">
                      <span className="line-clamp-2">{row.metaDescription ?? "—"}</span>
                      <span className="block text-[11px]">{row.metaDescription?.length ?? 0} chars</span>
                    </Td>
                    <Td>
                      <StatusBadge status={health.label === "Good" ? "PUBLISHED" : health.label.toUpperCase()} />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
    </>
  );
}
