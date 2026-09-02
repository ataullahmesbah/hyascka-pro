import type { Metadata } from "next";

import { JsonLd, PageHeader } from "@/components/ui/section";
import { IndustryGrid } from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { getIndustries } from "@/lib/content";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Industries",
    description:
      "Sector-specific digital strategy for SaaS, e-commerce, healthcare, professional services, education and real estate.",
    path: "/industries",
  });
}

export default async function IndustriesPage() {
  const industries = await getIndustries();
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Industries", path: "/industries" },
        ])}
      />
      <PageHeader
        eyebrow="Industries"
        title="Different markets fail in different places"
        description="These are the sectors where we already know where the money leaks — and what usually fixes it."
      >
        <ButtonLink href="/contact">Talk to us about your sector</ButtonLink>
      </PageHeader>
      <section className="section">
        <div className="container">
          <IndustryGrid items={industries} />
        </div>
      </section>
    </>
  );
}
