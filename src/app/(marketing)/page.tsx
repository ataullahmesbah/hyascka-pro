import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import {
  CapabilityRail,
  CaseStudyGrid,
  FinalCta,
  IndustryGrid,
  Metrics,
  ProcessTimeline,
  SectionHeading,
  ServicesGrid,
  Testimonials,
  TrustedBy,
  WhyUs,
} from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { JsonLd } from "@/components/ui/section";
import {
  getCaseStudies,
  getFaqs,
  getHomepage,
  getIndustries,
  getServices,
  getTestimonials,
} from "@/lib/content";
import { faqSchema, pageMetadata } from "@/lib/seo";

// Public pages are statically generated and revalidated (PRD §40.1).
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ path: "/" });
}

export default async function HomePage() {
  const [homepage, services, caseStudies, industries, testimonials, faqs] = await Promise.all([
    getHomepage(),
    getServices(),
    getCaseStudies(),
    getIndustries(),
    getTestimonials(),
    getFaqs(),
  ]);

  const topFaqs = faqs.slice(0, 6);

  return (
    <>
      <JsonLd data={faqSchema(topFaqs)} />

      <Hero content={homepage.hero} />
      <CapabilityRail items={homepage.capabilities} />
      <TrustedBy names={homepage.trustedBy} />

      <section className="section" id="services">
        <div className="container">
          <SectionHeading
            eyebrow="What we do"
            title="Services built around the number you are trying to move"
            description="Engineering, search, paid media and brand — delivered as one accountable programme rather than four disconnected suppliers."
          />
          <div className="mt-12">
            <ServicesGrid services={services} limit={6} />
          </div>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/services" variant="outline" size="lg">
              View all {services.length} services
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section border-y border-border bg-surface-2/40">
        <div className="container">
          <SectionHeading
            eyebrow="Why HYASCKA"
            title="Four commitments we hold ourselves to"
            description="Not positioning statements — these are written into the acceptance criteria of every engagement."
          />
          <div className="mt-12">
            <WhyUs items={homepage.whyUs} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="How we work"
            title="Six stages, no surprises"
            description="You always know what stage we are in, what is being decided, and what comes next."
            align="center"
          />
          <ProcessTimeline steps={homepage.process} />
        </div>
      </section>

      <section className="section border-y border-border bg-surface-2/40">
        <div className="container">
          <SectionHeading
            eyebrow="Selected work"
            title="Outcomes, with the numbers attached"
            description="Every case study states what changed and how it was measured."
          />
          <div className="mt-12">
            <CaseStudyGrid items={caseStudies} limit={2} />
          </div>
          <div className="mt-10 flex justify-center">
            <ButtonLink href="/work" variant="outline" size="lg">
              See all case studies
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Industries"
            title="Sectors where we already know the terrain"
            description="Different markets fail in different places. These are the ones we have mapped."
          />
          <div className="mt-12">
            <IndustryGrid items={industries.slice(0, 6)} />
          </div>
        </div>
      </section>

      <section className="section border-y border-border bg-surface-2/40">
        <div className="container">
          <SectionHeading
            eyebrow="Clients"
            title="What working with us is actually like"
            align="center"
          />
          <div className="mt-12">
            <Testimonials items={testimonials.slice(0, 3)} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="By the numbers" title="Where we stand today" align="center" />
          <div className="mt-12">
            <Metrics items={homepage.metrics} />
          </div>
        </div>
      </section>

      <section className="section border-t border-border">
        <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Questions"
            title="The things people ask before they get in touch"
            description="If your question is not here, ask it directly — we answer honestly, including when the answer is no."
          />
          <div>
            <Accordion
              items={topFaqs.map((faq, index) => ({
                id: `faq-${index}`,
                question: faq.question,
                answer: faq.answer,
              }))}
              defaultOpenId="faq-0"
            />
            <div className="mt-5">
              <ButtonLink href="/faq" variant="ghost" size="sm">
                Read all FAQs →
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <FinalCta content={homepage.finalCta} />
    </>
  );
}
