import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd, PageHeader } from "@/components/ui/section";
import { CaseStudyGrid } from "@/components/marketing/sections";
import { getCaseStudies, getCaseStudyBySlug } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const studies = await getCaseStudies();
  return studies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudyBySlug(slug);
  if (!study) return pageMetadata({ title: "Case study not found", noIndex: true });
  return pageMetadata({
    title: study.title,
    description: study.summary,
    path: `/work/${study.slug}`,
    type: "article",
  });
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [study, all] = await Promise.all([getCaseStudyBySlug(slug), getCaseStudies()]);
  if (!study) notFound();

  const others = all.filter((item) => item.slug !== study.slug).slice(0, 2);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
          { name: study.title, path: `/work/${study.slug}` },
        ])}
      />
      <PageHeader eyebrow={`${study.industry} · ${study.client}`} title={study.title} description={study.summary}>
        <ButtonLink href="/contact">Discuss a similar project</ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container-x">
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {study.metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-line bg-surface p-6">
                <dt className="text-xs uppercase tracking-wider text-ink-muted">{metric.label}</dt>
                <dd className="accent-plain mt-2 font-display text-2xl font-bold">{metric.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-14 grid gap-10 lg:grid-cols-[1.5fr_0.5fr]">
            <div className="prose-hy max-w-prose">
              <h2>The challenge</h2>
              <p>{study.challenge}</p>
              <h2>What we did</h2>
              <p>{study.solution}</p>
              <h2>The outcome</h2>
              <p>{study.outcome}</p>
            </div>
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-line bg-surface p-6">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider">Client</h2>
                <p className="mt-2 text-sm text-ink-muted">{study.client}</p>
                <h2 className="mt-5 font-display text-sm font-semibold uppercase tracking-wider">Industry</h2>
                <p className="mt-2 text-sm text-ink-muted">{study.industry}</p>
                <h2 className="mt-5 font-display text-sm font-semibold uppercase tracking-wider">Services</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {study.services.map((service) => (
                    <Badge key={service} tone="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {others.length ? (
        <section className="section border-t border-line">
          <div className="container-x">
            <h2 className="font-display text-2xl font-bold">More work</h2>
            <div className="mt-8">
              <CaseStudyGrid items={others} />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
