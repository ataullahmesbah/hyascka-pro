import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock, Layers } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon";
import { Reveal } from "@/components/ui/reveal";
import { JsonLd, SectionHeading } from "@/components/ui/section";
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

      {/*
        A service page is a sales page, so the top of it has to answer "what is
        this, what do I get, what does it cost and how long does it take"
        without scrolling. The old header was a title and a tagline in a very
        tall empty band.
      */}
      <section className="hero-surface relative overflow-hidden border-b border-line">
        <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-x relative grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <nav aria-label="Breadcrumb" className="text-step--2 text-ink-muted">
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
              <span className="px-1.5">/</span>
              <Link href="/services" className="transition-colors hover:text-ink">
                Services
              </Link>
              <span className="px-1.5">/</span>
              <span className="text-ink-soft">{service.title}</span>
            </nav>

            <span className="eyebrow mt-4">
              <IconBadge name={service.icon} size="xs" />
              {PRICING_LABEL[service.pricingModel]}
            </span>

            <h1 className="mt-4 max-w-[20ch] text-step-5 font-bold tracking-tight">
              {service.title}
            </h1>
            <p className="mt-4 max-w-[54ch] text-step-1 leading-relaxed text-ink-soft">
              {service.tagline}
            </p>

            {/* The deliverables an editor already maintains, doubling as proof. */}
            <ul className="mt-6 flex flex-wrap gap-2">
              {service.deliverables.slice(0, 4).map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-step--2 text-ink-soft"
                >
                  <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={`/contact?service=${service.slug}`} size="lg">
                Request a proposal
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/work" variant="outline" size="lg">
                See related work
              </ButtonLink>
            </div>
          </div>

          {/* Price, timeline and what is included, above the fold. */}
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <p className="text-step--2 font-semibold uppercase tracking-wide text-ink-muted">
              {PRICING_LABEL[service.pricingModel]}
            </p>
            <p className="mt-1 font-display text-step-4 font-bold tracking-tight">
              {service.startingPrice
                ? formatCurrency(service.startingPrice, service.currency)
                : "On request"}
            </p>
            <p className="mt-3 flex items-start gap-2 text-step--1 text-ink-soft">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              {service.timeline}
            </p>
            <p className="mt-2 flex items-start gap-2 text-step--1 text-ink-soft">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
              {service.deliverables.length} deliverables · {service.processSteps.length} stages
            </p>
            <ButtonLink href={`/contact?service=${service.slug}`} className="mt-5 w-full">
              Request a proposal
            </ButtonLink>
            <p className="mt-3 text-center text-step--2 text-ink-muted">
              Fixed scope · No obligation
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="prose-hy max-w-prose">
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
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <h3 className="font-display text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.detail}</p>
                </Reveal>
              ))}
            </div>

            <h2 className="mt-14 font-display text-2xl font-bold">How we deliver it</h2>
            <ol className="mt-6 space-y-4">
              {service.processSteps.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-xl border border-line bg-surface p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.detail}</p>
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
                          ? "relative rounded-xl border border-accent/45 bg-surface p-6 shadow-accent"
                          : "rounded-xl border border-line bg-surface p-6"
                      }
                    >
                      {pkg.highlighted ? (
                        <Badge tone="accent" className="absolute -top-2.5 left-6">
                          Most chosen
                        </Badge>
                      ) : null}
                      <h3 className="font-display text-lg font-semibold">{pkg.name}</h3>
                      <p className="mt-1.5 text-sm text-ink-muted">{pkg.summary}</p>
                      <p className="mt-4 font-display text-2xl font-bold">
                        {pkg.price
                          ? formatCurrency(pkg.price, service.currency)
                          : "Custom quote"}
                        {pkg.price && pkg.billingCycle ? (
                          <span className="ml-1 text-sm font-normal text-ink-muted">
                            {pkg.billingCycle}
                          </span>
                        ) : null}
                      </p>
                      <ul className="mt-5 space-y-2.5">
                        {pkg.features.map((feature) => (
                          <li key={feature} className="flex gap-2 text-sm text-ink-muted">
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
            {/* The price and timeline are in the hero; repeating them here just
                made the reader check whether the two agreed. This column is
                what the hero cannot fit. */}
            <div className="rounded-xl border border-line bg-surface p-6">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider">
                What you receive
              </h2>
              <ul className="mt-4 space-y-2.5">
                {service.deliverables.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-ink-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink href={`/contact?service=${service.slug}`} className="mt-5 w-full">
                Request a proposal
              </ButtonLink>
            </div>

            {service.technologies.length ? (
              <div className="rounded-xl border border-line bg-surface p-6">
                <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider">
                  <Layers className="h-4 w-4 text-accent" />
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
        <section className="section border-t border-line">
          <div className="container-x">
            <SectionHeading eyebrow="Also relevant" title="Services that pair well with this" />
            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/services/${item.slug}`}
                  className="group rounded-xl border border-line bg-surface p-5 transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg motion-reduce:hover:translate-y-0"
                >
                  <IconBadge name={item.icon} size="sm" />
                  <h3 className="mt-4 font-display text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{item.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
