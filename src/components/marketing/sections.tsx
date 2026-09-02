import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon";
import { Counter, Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section";
import type {
  CaseStudySeed,
  IndustrySeed,
  ServiceSeed,
  TestimonialSeed,
} from "@/content/types";
import type { homepage } from "@/content/site";

/** Social proof directly below the fold (PRD §39.5). */
export function TrustedBy({ names }: { names: string[] }) {
  return (
    <section className="border-y border-border bg-surface-2/50 py-8">
      <div className="container">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Trusted by teams building for growth
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {names.map((name) => (
            <span
              key={name}
              className="font-display text-base font-semibold text-muted-foreground/75 transition-colors hover:text-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CapabilityRail({ items }: { items: typeof homepage.capabilities }) {
  return (
    <section className="border-b border-border py-6">
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center gap-2.5">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="brand-ring inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft motion-reduce:hover:translate-y-0"
              >
                <IconBadge name={item.icon} size="sm" className="h-7 w-7 rounded-md" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Asymmetric bento grid rather than a uniform 3-column grid (PRD §39.3). */
export function ServicesGrid({
  services,
  limit,
}: {
  services: ServiceSeed[];
  limit?: number;
}) {
  const items = limit ? services.slice(0, limit) : services;
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((service, index) => (
        <Reveal
          key={service.slug}
          as="article"
          delay={(index % 3) * 70}
          className={cn(index === 0 && "lg:col-span-2")}
        >
          <Link
            href={`/services/${service.slug}`}
            className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated motion-reduce:hover:translate-y-0"
          >
            <div className="flex items-start justify-between gap-4">
              <IconBadge name={service.icon} />
              {service.startingPrice ? (
                <Badge tone="outline">from {formatCurrency(service.startingPrice, service.currency)}</Badge>
              ) : (
                <Badge tone="outline">Custom quote</Badge>
              )}
            </div>
            <h3 className="mt-5 font-display text-lg font-semibold">{service.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {service.shortDescription}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Explore service
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

export function WhyUs({ items }: { items: typeof homepage.whyUs }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item, index) => (
        <Reveal
          key={item.title}
          delay={index * 70}
          className={cn(
            "rounded-xl border border-border bg-card p-6",
            item.span === "lg" ? "md:col-span-2" : "md:col-span-1",
          )}
        >
          <IconBadge name={item.icon} />
          <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
        </Reveal>
      ))}
    </div>
  );
}

/** Narrative scroll-reveal timeline (PRD §39.3). */
export function ProcessTimeline({ steps }: { steps: typeof homepage.process }) {
  return (
    <ol className="relative mt-12 space-y-8 before:absolute before:left-[1.4rem] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-primary/60 before:via-border before:to-transparent md:before:left-1/2">
      {steps.map((step, index) => (
        <Reveal
          as="li"
          key={step.step}
          delay={index * 60}
          className="relative grid gap-4 md:grid-cols-2 md:gap-12"
        >
          <div
            className={cn(
              "flex gap-5 md:contents",
            )}
          >
            <span className="brand-gradient relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-glow md:absolute md:left-1/2 md:-translate-x-1/2">
              {step.step}
            </span>
            <div
              className={cn(
                "rounded-xl border border-border bg-card p-5",
                index % 2 === 0 ? "md:col-start-1 md:mr-8 md:text-right" : "md:col-start-2 md:ml-8",
              )}
            >
              <h3 className="font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

export function Metrics({ items }: { items: typeof homepage.metrics }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((metric, index) => (
        <Reveal
          key={metric.label}
          delay={index * 60}
          className="brand-ring rounded-xl border border-border bg-card p-6 text-center"
        >
          <p className="brand-text font-display text-4xl font-extrabold">
            <Counter value={metric.value} suffix={metric.suffix} />
          </p>
          <p className="mt-2 font-display text-sm font-semibold">{metric.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function CaseStudyGrid({ items, limit }: { items: CaseStudySeed[]; limit?: number }) {
  const studies = limit ? items.slice(0, limit) : items;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {studies.map((study, index) => (
        <Reveal key={study.slug} as="article" delay={(index % 2) * 70}>
          <Link
            href={`/work/${study.slug}`}
            className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated motion-reduce:hover:translate-y-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{study.industry}</Badge>
              <span className="text-xs text-muted-foreground">{study.client}</span>
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold leading-snug">{study.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{study.summary}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              {study.metrics.slice(0, 2).map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs text-muted-foreground">{metric.label}</dt>
                  <dd className="brand-text font-display text-lg font-bold">{metric.value}</dd>
                </div>
              ))}
            </dl>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              Read the case study
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

export function IndustryGrid({ items }: { items: IndustrySeed[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((industry, index) => (
        <Reveal key={industry.slug} delay={(index % 3) * 60}>
          <Link
            href={`/industries/${industry.slug}`}
            className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated motion-reduce:hover:translate-y-0"
          >
            <IconBadge name={industry.icon} />
            <h3 className="mt-5 font-display text-lg font-semibold">{industry.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {industry.headline}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              See how we help
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

export function Testimonials({ items }: { items: TestimonialSeed[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((testimonial, index) => (
        <Reveal
          key={testimonial.author}
          as="article"
          delay={(index % 3) * 70}
          className="flex h-full flex-col rounded-xl border border-border bg-card p-6"
        >
          <Quote className="h-6 w-6 text-primary/45" aria-hidden />
          <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
            “{testimonial.quote}”
          </blockquote>
          <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
            <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
              {testimonial.author
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{testimonial.author}</p>
              <p className="truncate text-xs text-muted-foreground">
                {testimonial.role}
                {testimonial.company ? `, ${testimonial.company}` : ""}
              </p>
            </div>
            <span className="ml-auto flex gap-0.5" aria-label={`${testimonial.rating} out of 5`}>
              {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                <Star key={starIndex} className="h-3.5 w-3.5 fill-warning text-warning" />
              ))}
            </span>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function FinalCta({ content }: { content: typeof homepage.finalCta }) {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="brand-ring relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center md:px-16 md:py-20">
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/22 blur-[100px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent/20 blur-[100px]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-[2.75rem]">
              {content.headline}
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{content.subheadline}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink href={content.primaryCta.href} size="lg">
                {content.primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={content.secondaryCta.href} variant="outline" size="lg">
                {content.secondaryCta.label}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export { SectionHeading };
