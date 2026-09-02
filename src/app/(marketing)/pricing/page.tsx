import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { JsonLd, PageHeader, SectionHeading } from "@/components/ui/section";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/table";
import { getFaqs, getServices } from "@/lib/content";
import { breadcrumbSchema, faqSchema, pageMetadata } from "@/lib/seo";
import { formatCurrency } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Pricing",
    description:
      "Transparent starting prices for every HYASCKA service, a package comparison table, and how our fixed-scope proposals work.",
    path: "/pricing",
  });
}

const COMPARISON = [
  { feature: "Discovery and success metrics agreed in writing", launch: true, growth: true, platform: true },
  { feature: "Design system and responsive build", launch: true, growth: true, platform: true },
  { feature: "CMS control of all page content", launch: true, growth: true, platform: true },
  { feature: "Core Web Vitals budget enforced in CI", launch: true, growth: true, platform: true },
  { feature: "Blog and case study modules", launch: false, growth: true, platform: true },
  { feature: "Advanced SEO and structured data", launch: false, growth: true, platform: true },
  { feature: "Lead routing and CRM handoff", launch: false, growth: true, platform: true },
  { feature: "Server-side conversion tracking", launch: false, growth: true, platform: true },
  { feature: "Client portal with projects and invoices", launch: false, growth: false, platform: true },
  { feature: "Payments, invoicing and finance module", launch: false, growth: false, platform: true },
  { feature: "Role-based access control", launch: false, growth: false, platform: true },
  { feature: "Dedicated delivery team", launch: false, growth: false, platform: true },
  { feature: "Post-launch support", launch: true, growth: true, platform: true },
];

const TIERS = [
  { key: "launch", name: "Launch", price: 180000, blurb: "Be credible quickly.", cta: "Start with Launch" },
  { key: "growth", name: "Growth", price: 380000, blurb: "The full agency-grade site.", cta: "Choose Growth", highlighted: true },
  { key: "platform", name: "Platform", price: null, blurb: "Website plus the system behind it.", cta: "Request a quote" },
] as const;

export default async function PricingPage() {
  const [services, faqs] = await Promise.all([getServices(), getFaqs()]);
  const pricingFaqs = faqs.filter((faq) => faq.category === "Pricing" || faq.category === "Working together");

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ])}
      />
      <JsonLd data={faqSchema(pricingFaqs)} />

      <PageHeader
        eyebrow="Pricing"
        title="Published starting prices, fixed-scope proposals"
        description="You will never get an hourly estimate that drifts. After a discovery call you receive a proposal with scope, deliverables, timeline and a fixed price."
      >
        <ButtonLink href="/contact">Book a discovery call</ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container-x">
          <SectionHeading eyebrow="Build packages" title="Three ways to start a build" align="center" />

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.key}
                className={
                  "highlighted" in tier && tier.highlighted
                    ? "relative rounded-2xl border border-accent/45 bg-surface p-7 shadow-accent"
                    : "rounded-2xl border border-line bg-surface p-7"
                }
              >
                {"highlighted" in tier && tier.highlighted ? (
                  <Badge tone="accent" className="absolute -top-3 left-7">
                    Most chosen
                  </Badge>
                ) : null}
                <h2 className="font-display text-xl font-bold">{tier.name}</h2>
                <p className="mt-1.5 text-sm text-ink-muted">{tier.blurb}</p>
                <p className="mt-5 font-display text-3xl font-bold">
                  {tier.price ? (
                    <>
                      <span className="text-base font-medium text-ink-muted">from </span>
                      {formatCurrency(tier.price)}
                    </>
                  ) : (
                    "Custom quote"
                  )}
                </p>
                <ButtonLink
                  href="/contact"
                  variant={"highlighted" in tier && tier.highlighted ? "primary" : "outline"}
                  className="mt-6 w-full"
                >
                  {tier.cta}
                </ButtonLink>
              </div>
            ))}
          </div>

          {/* Package comparison table (PRD §39.6) */}
          <div className="mt-12">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th className="min-w-[18rem]">What is included</Th>
                    <Th className="text-center">Launch</Th>
                    <Th className="text-center">Growth</Th>
                    <Th className="text-center">Platform</Th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <Tr key={row.feature}>
                      <Td className="font-medium">{row.feature}</Td>
                      {(["launch", "growth", "platform"] as const).map((tier) => (
                        <Td key={tier} className="text-center">
                          {row[tier] ? (
                            <Check className="mx-auto h-4 w-4 text-success" aria-label="Included" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-ink-muted/60" aria-label="Not included" />
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </div>
        </div>
      </section>

      <section className="section border-y border-line bg-surface-2/40">
        <div className="container-x">
          <SectionHeading
            eyebrow="Every service"
            title="Starting price by service"
            description="Retainers are billed monthly with 30 days' notice. Project work is billed against agreed milestones."
          />
          <div className="mt-10">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th className="min-w-[16rem]">Service</Th>
                    <Th>Pricing model</Th>
                    <Th>Starts at</Th>
                    <Th>Typical timeline</Th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <Tr key={service.slug}>
                      <Td>
                        <a
                          href={`/services/${service.slug}`}
                          className="font-medium underline-offset-4 hover:text-accent hover:underline"
                        >
                          {service.title}
                        </a>
                      </Td>
                      <Td className="text-ink-muted">
                        {service.pricingModel.replace(/_/g, " ").toLowerCase()}
                      </Td>
                      <Td className="font-semibold">
                        {service.startingPrice
                          ? formatCurrency(service.startingPrice, service.currency)
                          : "Custom"}
                      </Td>
                      <Td className="text-ink-muted">{service.timeline}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading eyebrow="Questions" title="How pricing and engagements work" />
          <Accordion
            items={pricingFaqs.map((faq, index) => ({
              id: `pricing-faq-${index}`,
              question: faq.question,
              answer: faq.answer,
            }))}
            defaultOpenId="pricing-faq-0"
          />
        </div>
      </section>
    </>
  );
}
