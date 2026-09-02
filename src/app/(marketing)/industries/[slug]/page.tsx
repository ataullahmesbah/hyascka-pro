import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { JsonLd, PageHeader } from "@/components/ui/section";
import { ServicesGrid } from "@/components/marketing/sections";
import { getIndustries, getIndustryBySlug, getServices } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  const industries = await getIndustries();
  return industries.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);
  if (!industry) return pageMetadata({ title: "Industry not found", noIndex: true });
  return pageMetadata({
    title: `${industry.name} Digital Services`,
    description: industry.description,
    path: `/industries/${industry.slug}`,
  });
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [industry, services] = await Promise.all([getIndustryBySlug(slug), getServices()]);
  if (!industry) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
          { name: industry.name, path: `/industries/${industry.slug}` },
        ])}
      />
      <PageHeader eyebrow={industry.name} title={industry.headline} description={industry.description}>
        <ButtonLink href="/contact">Request a proposal</ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container-x grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-7">
            <h2 className="font-display text-xl font-bold">Where it usually breaks</h2>
            <ul className="mt-5 space-y-3">
              {industry.challenges.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink-muted">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-surface p-7">
            <h2 className="font-display text-xl font-bold">How we fix it</h2>
            <ul className="mt-5 space-y-3">
              {industry.solutions.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section border-t border-line">
        <div className="container-x">
          <h2 className="font-display text-2xl font-bold">Services we usually start with</h2>
          <div className="mt-8">
            <ServicesGrid services={services} limit={3} />
          </div>
        </div>
      </section>
    </>
  );
}
