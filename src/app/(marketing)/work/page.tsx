import type { Metadata } from "next";

import { JsonLd, PageHeader } from "@/components/ui/section";
import { CaseStudyGrid } from "@/components/marketing/sections";
import { WorkFilter } from "@/components/marketing/work-filter";
import { ButtonLink } from "@/components/ui/button";
import { getCaseStudies } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Case Studies",
    description:
      "Real client outcomes with the numbers attached — organic growth, checkout conversion, local visibility and operational automation.",
    path: "/work",
  });
}

export default async function WorkPage() {
  const studies = await getCaseStudies();
  const industries = [...new Set(studies.map((study) => study.industry))];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Work", path: "/work" },
        ])}
      />
      <PageHeader
        eyebrow="Selected work"
        title="What we changed, and how it was measured"
        description="Every case study states the problem, the intervention and the result. Where a number appears, it came from the client's own analytics."
      >
        <ButtonLink href="/contact">Start a project</ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container">
          <WorkFilter
            industries={industries}
            slugs={studies.map((study) => ({ slug: study.slug, industry: study.industry }))}
          >
            <CaseStudyGrid items={studies} />
          </WorkFilter>
        </div>
      </section>
    </>
  );
}
