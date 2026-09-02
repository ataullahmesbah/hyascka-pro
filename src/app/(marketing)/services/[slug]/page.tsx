import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, Layers } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { JsonLd, PageHeader, SectionHeading } from "@/components/ui/section";
import { QuoteCalculator } from "@/components/marketing/quote-calculator";
import { getServiceBySlug, getServices } from "@/lib/content";
import { isFeatureEnabled } from "@/lib/settings";
import { breadcrumbSchema, faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";
import { formatCurrency } from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return pageMetadata({ title: "Service not found", noIndex: true });
  return pageMetadata({
    title: `${service.title} Services`,
    description: service.shortDescription,
    path: `/services/${service.slug}`,
  });
}

const PRICING_LABEL: Record<string, string> = {
  FIXED: "Fixed price",
  STARTING_FROM: "Starting from",
  CUSTOM_QUOTE: "Custom quote",
  MONTHLY_RETAINER: "Monthly retainer",
  HIDDEN: "On request",
};

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, all, calculatorEnabled] = await Promise.all([
    getServiceBySlug(slug),
    getServices(),
    isFeatureEnabled("quote_calculator"),
  ]);
  if (!service) notFound();

  const related = all.filter((item) => item.slug !== service.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={serviceSchema(service)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ])}
      />
      {service.faqs.length ? <JsonLd data={faqSchema(service.faqs)} /> : null}

      <PageHeader eyebrow={PRICING_LABEL[service.pricingModel]} title={service.title} description={service.tagline}>
        <ButtonLink href={`/contact?service=${service.slug}`}>
          Request a proposal
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
        <ButtonLink href="/work" variant="outline">
          See related work
        </ButtonLink>
      </PageHeader>

      <section className="section">
        <div className="container grid gap-12 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              {service.longDescription.split("\n\n").map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>

            <h2 className="mt-14 font-display text-2xl font-bold">What makes this work</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {service.features.map((feature, index) => (
                <Reveal
                  key={feature.title}
                  delay={(index % 2) * 60}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <h3 className="font-display text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.detail}</p>
                </Reveal>
              ))}
            </div>

            <h2 className="mt-14 font-display text-2xl font-bold">How we deliver it</h2>
            <ol className="mt-6 space-y-4">
              {service.processSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                  <span className="brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            {service.packages?.length ? (
              <>
                <h2 className="mt-14 font-display text-2xl font-bold">Packages</h2>
                <div className="mt-6 grid gap-5 md:grid-cols-3">
                  {service.packages.map((pkg) => (
                    <div
                      key={pkg.name}
                      className={
                        pkg.highlighted
                          ? "brand-ring relative rounded-xl border border-primary/45 bg-card p-6 shadow-glow"
                          : "rounded-xl border border-border bg-card p-6"
                      }
                    >
                      {pkg.highlighted ? (
                        <Badge tone="primary" className="absolute -top-2.5 left-6">
                          Most chosen
                        </Badge>
                      ) : null}
                      <h3 className="font-display text-lg font-semibold">{pkg.name}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{pkg.summary}</p>
                      <p className="mt-4 font-display text-2xl font-bold">
                        {pkg.price
                          ? formatCurrency(pkg.price, service.currency)
                          : "Custom quote"}
                        {pkg.price && pkg.billingCycle ? (
                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            {pkg.billingCycle}
                          </span>
                        ) : null}
                      </p>
                      <ul className="mt-5 space-y-2.5">
                        {pkg.features.map((feature) => (
                          <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <ButtonLink
                        href={`/contact?service=${service.slug}&package=${encodeURIComponent(pkg.name)}`}
                        variant={pkg.highlighted ? "primary" : "outline"}
                        size="sm"
                        className="mt-6 w-full"
                      >
                        Choose {pkg.name}
                      </ButtonLink>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {service.faqs.length ? (
              <>
                <h2 className="mt-14 font-display text-2xl font-bold">Common questions</h2>
                <Accordion
                  className="mt-6"
                  items={service.faqs.map((faq, index) => ({
                    id: `svc-faq-${index}`,
                    question: faq.question,
                    answer: faq.answer,
                  }))}
                />
              </>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="brand-ring rounded-xl border border-border bg-card p-6">
              <IconBadge name={service.icon} size="lg" />
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {PRICING_LABEL[service.pricingModel]}
              </p>
              <p className="brand-text font-display text-3xl font-extrabold">
                {service.startingPrice
                  ? formatCurrency(service.startingPrice, service.currency)
                  : "Custom quote"}
              </p>
              {service.timeline ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {service.timeline}
                </p>
              ) : null}
              <ButtonLink href={`/contact?service=${service.slug}`} className="mt-5 w-full">
                Request a proposal
              </ButtonLink>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Fixed scope · No obligation
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider">
                What you receive
              </h2>
              <ul className="mt-4 space-y-2.5">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {service.technologies.length ? (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider">
                  <Layers className="h-4 w-4 text-primary" />
                  Tools we use
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.technologies.map((tech) => (
                    <Badge key={tech} tone="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {calculatorEnabled ? (
              <QuoteCalculator serviceTitle={service.title} serviceSlug={service.slug} currency={service.currency} />
            ) : null}
          </aside>
        </div>
      </section>

      {related.length ? (
        <section className="section border-t border-border">
          <div className="container">
            <SectionHeading eyebrow="Also relevant" title="Services that pair well with this" />
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/services/${item.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated motion-reduce:hover:translate-y-0"
                >
                  <IconBadge name={item.icon} size="sm" />
                  <h3 className="mt-4 font-display text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{item.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
