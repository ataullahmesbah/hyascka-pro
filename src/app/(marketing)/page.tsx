import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/marketing/hero";
import { MetricVisual } from "@/components/marketing/metric-visual";
import { NetworkVisual } from "@/components/marketing/network-visual";
import { WorldMap } from "@/components/marketing/world-map";
import { Sponsors } from "@/components/marketing/sponsors";
import {
  CapabilityRail,
  CaseStudyGrid,
  FinalCta,
  IndustryGrid,
  Metrics,
  Commitments,
  EngagementSteps,
  ProcessTimeline,
  SectionHeading,
  ServicesGrid,
  Testimonials,
  WhyUs,
} from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { FaqColumns } from "@/components/ui/accordion";
import { JsonLd } from "@/components/ui/section";
import {
  getCaseStudies,
  getFaqs,
  getHomepage,
  getIndustries,
  getServices,
  getTestimonials,
} from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { faqSchema, pageMetadata, websiteSchema } from "@/lib/seo";

// Statically generated, revalidated every 5 minutes; the CMS republishes on save.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ path: "/" });
}

export default async function HomePage() {
  const [homepage, services, caseStudies, industries, testimonials, faqs, settings] =
    await Promise.all([
      getHomepage(),
      getServices(),
      getCaseStudies(),
      getIndustries(),
      getTestimonials(),
      getFaqs(),
      getSettings(),
    ]);

  // 20 questions, split into the two labelled parts the FAQ block renders.
  const categories = [...new Set(faqs.map((faq) => faq.category))];
  const parts = categories.slice(0, 2).map((category) => ({
    title: category,
    items: faqs
      .filter((faq) => faq.category === category)
      .slice(0, 10)
      .map((faq, index) => ({
        id: `faq-${category}-${index}`.replace(/\s+/g, "-").toLowerCase(),
        question: faq.question,
        answer: faq.answer,
      })),
  }));

  return (
    <>
      <JsonLd data={websiteSchema()} />
      <JsonLd data={faqSchema(faqs)} />

      <Hero
        content={homepage.hero}
        visuals={[<WorldMap key="map" />, <NetworkVisual key="globe" />, <MetricVisual key="metrics" />]}
      />
      <CapabilityRail items={homepage.capabilities} />

      {settings.featureFlags.sponsors_marquee ? <Sponsors content={settings.sponsors} /> : null}

      <section className="section" id="services">
        <div className="container-x">
          <SectionHeading
            eyebrow="What we do"
            title="Services built around the number you are trying to move"
            description="Engineering, search, paid media and brand — delivered as one accountable programme rather than four disconnected suppliers."
          />
          <div className="mt-10">
            <ServicesGrid services={services} limit={6} />
          </div>
          <div className="mt-9 flex justify-center">
            <ButtonLink href="/services" variant="outline" size="lg">
              View all {services.length} services
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section border-y border-line bg-bg-subtle">
        <div className="container-x">
          <SectionHeading
            eyebrow="Why HYASCKA"
            title="Four commitments we hold ourselves to"
            description="Not positioning statements — these are written into the acceptance criteria of every engagement."
          />
          <div className="mt-10">
            <WhyUs items={homepage.whyUs} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="How we work"
            title="Six stages, no surprises"
            description="You always know what stage we are in, what is being decided, and what comes next."
            align="center"
          />
          <ProcessTimeline steps={homepage.process} />
        </div>
      </section>

      {/* The two questions a prospect has after "can they do it": how do we
          start, and what am I committing to. */}
      <section className="section border-y border-line bg-bg-subtle">
        <div className="container-x">
          <SectionHeading
            eyebrow="Getting started"
            title="Three steps from here to underway"
            description="No procurement theatre. A call, a proposal you can act on, and a start date."
            align="center"
          />
          <EngagementSteps steps={homepage.engagement} />
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/contact" size="lg">
              Book the call
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="What you can hold us to"
            title="Four commitments, in writing"
            description="Every one of these is in the contract, not just on this page."
            align="center"
          />
          <div className="mt-10">
            <Commitments items={homepage.commitments} />
          </div>
        </div>
      </section>

      <section className="section border-y border-line bg-bg-subtle">
        <div className="container-x">
          <SectionHeading
            eyebrow="Selected work"
            title="Outcomes, with the numbers attached"
            description="Every case study states what changed and how it was measured."
          />
          <div className="mt-10">
            <CaseStudyGrid items={caseStudies} limit={2} />
          </div>
          <div className="mt-9 flex justify-center">
            <ButtonLink href="/work" variant="outline" size="lg">
              See all case studies
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="By the numbers" title="Where we stand today" align="center" />
          <div className="mt-10">
            <Metrics items={homepage.metrics} />
          </div>
        </div>
      </section>

      <section className="section border-y border-line bg-bg-subtle">
        <div className="container-x">
          <SectionHeading
            eyebrow="Industries"
            title="Sectors where we already know the terrain"
            description="Different markets fail in different places. These are the ones we have mapped."
          />
          <div className="mt-10">
            <IndustryGrid items={industries.slice(0, 6)} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Clients" title="What working with us is actually like" align="center" />
          <div className="mt-10">
            <Testimonials items={testimonials.slice(0, 3)} />
          </div>
        </div>
      </section>

      <section className="section border-t border-line" id="faq">
        <div className="container-x">
          <SectionHeading
            eyebrow="Questions"
            title="Everything people ask before they get in touch"
            description="Twenty honest answers, including the inconvenient ones. If yours is not here, ask it directly."
            align="center"
          />
          <div className="mt-10">
            <FaqColumns parts={parts} />
          </div>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/contact" variant="outline">
              Ask us something else
            </ButtonLink>
          </div>
        </div>
      </section>

      <FinalCta content={homepage.finalCta} />
    </>
  );
}
