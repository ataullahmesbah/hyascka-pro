import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { IconBadge } from "@/components/ui/icon";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section";
import { HexTexture } from "@/components/marketing/network-visual";
import type { CaseStudySeed, IndustrySeed, ServiceSeed, TestimonialSeed } from "@/content/types";
import type { homepage } from "@/content/site";

export function CapabilityRail({ items }: { items: typeof homepage.capabilities }) {
  return (
    <section className="border-b border-line bg-bg py-5">
      <div className="container-x">
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="inline-flex items-center gap-2.5 rounded-pill border border-line bg-surface px-3.5 py-1.5 text-step--1 font-medium text-ink-soft transition-colors duration-fast hover:border-accent-border hover:bg-surface-2 hover:text-ink"
              >
                <IconBadge name={item.icon} size="xs" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Asymmetric bento rather than a uniform grid, so the eye has somewhere to go. */
export function ServicesGrid({ services, limit }: { services: ServiceSeed[]; limit?: number }) {
  const items = limit ? services.slice(0, limit) : services;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((service, index) => (
        <Reveal
          key={service.slug}
          as="article"
          delay={(index % 3) * 60}
          className={cn(index === 0 && limit ? "lg:col-span-2" : "")}
        >
          <Link
            href={`/services/${service.slug}`}
            className="card card-hover group flex h-full flex-col p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <IconBadge name={service.icon} />
              <Badge tone="outline">
                {service.startingPrice
                  ? `from ${formatCurrency(service.startingPrice, service.currency)}`
                  : "Custom quote"}
              </Badge>
            </div>
            <h3 className="mt-5 text-step-1 font-semibold">{service.title}</h3>
            <p className="mt-2 flex-1 text-step--1 leading-relaxed text-ink-soft">
              {service.shortDescription}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-step--1 font-semibold text-accent">
              Explore service
              <ArrowRight className="h-4 w-4 transition-transform duration-fast group-hover:translate-x-1 motion-reduce:transform-none" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

export function WhyUs({ items }: { items: typeof homepage.whyUs }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        <Reveal
          key={item.title}
          delay={index * 60}
          className={cn("card p-6", item.span === "lg" ? "md:col-span-2" : "md:col-span-1")}
        >
          <IconBadge name={item.icon} />
          <h3 className="mt-5 text-step-1 font-semibold">{item.title}</h3>
          <p className="mt-2 text-step--1 leading-relaxed text-ink-soft">{item.detail}</p>
        </Reveal>
      ))}
    </div>
  );
}

/** Narrative timeline — alternating on desktop, single column on mobile. */
export function ProcessTimeline({ steps }: { steps: typeof homepage.process }) {
  return (
    <ol className="relative mt-12 space-y-4 md:space-y-0">
      <span
        className="absolute left-[1.4rem] top-3 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-accent/50 via-line to-transparent md:left-1/2 md:block"
        aria-hidden
      />
      {steps.map((step, index) => (
        <Reveal as="li" key={step.step} delay={index * 50} className="md:grid md:grid-cols-2 md:gap-12 md:py-4">
          <div
            className={cn(
              "card relative p-5",
              index % 2 === 0
                ? "md:col-start-1 md:mr-10 md:text-right"
                : "md:col-start-2 md:ml-10",
            )}
          >
            <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-pill bg-accent-soft text-step--2 font-bold text-accent md:hidden">
              {step.step}
            </span>
            <h3 className="text-step-1 font-semibold">{step.title}</h3>
            <p className="mt-2 text-step--1 leading-relaxed text-ink-soft">{step.detail}</p>
            <span
              className={cn(
                "absolute top-6 hidden h-8 w-8 items-center justify-center rounded-pill border-4 border-bg bg-accent text-step--2 font-bold text-accent-ink md:flex",
                index % 2 === 0 ? "-right-[3.25rem]" : "-left-[3.25rem]",
              )}
              aria-hidden
            >
              {step.step}
            </span>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

export function Metrics({ items }: { items: typeof homepage.metrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((metric, index) => (
        <Reveal key={metric.label} delay={index * 50} className="card p-6 text-center">
          <p className="text-step-4 font-extrabold text-accent tabular">
            <Counter value={metric.value} suffix={metric.suffix} />
          </p>
          <p className="mt-1.5 text-step--1 font-semibold">{metric.label}</p>
          <p className="mt-1 text-step--2 text-ink-muted">{metric.detail}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function CaseStudyGrid({ items, limit }: { items: CaseStudySeed[]; limit?: number }) {
  const studies = limit ? items.slice(0, limit) : items;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {studies.map((study, index) => (
        <Reveal key={study.slug} as="article" delay={(index % 2) * 60}>
          <Link href={`/work/${study.slug}`} className="card card-hover group flex h-full flex-col p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{study.industry}</Badge>
              <span className="text-step--2 text-ink-muted">{study.client}</span>
            </div>
            <h3 className="mt-4 text-step-2 font-semibold leading-snug">{study.title}</h3>
            <p className="mt-2 flex-1 text-step--1 leading-relaxed text-ink-soft">{study.summary}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
              {study.metrics.slice(0, 2).map((metric) => (
                <div key={metric.label}>
                  <dt className="text-step--2 text-ink-muted">{metric.label}</dt>
                  <dd className="text-step-1 font-bold text-accent tabular">{metric.value}</dd>
                </div>
              ))}
            </dl>
            <span className="mt-5 inline-flex items-center gap-1.5 text-step--1 font-semibold text-accent">
              Read the case study
              <ArrowRight className="h-4 w-4 transition-transform duration-fast group-hover:translate-x-1 motion-reduce:transform-none" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

export function IndustryGrid({ items }: { items: IndustrySeed[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((industry, index) => (
        <Reveal key={industry.slug} delay={(index % 3) * 50}>
          <Link href={`/industries/${industry.slug}`} className="card card-hover group flex h-full flex-col p-6">
            <IconBadge name={industry.icon} />
            <h3 className="mt-5 text-step-1 font-semibold">{industry.name}</h3>
            <p className="mt-2 flex-1 text-step--1 leading-relaxed text-ink-soft">{industry.headline}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-step--1 font-semibold text-accent">
              See how we help
              <ArrowRight className="h-4 w-4 transition-transform duration-fast group-hover:translate-x-1 motion-reduce:transform-none" />
            </span>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

export function Testimonials({ items }: { items: TestimonialSeed[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((testimonial, index) => (
        <Reveal
          key={testimonial.author}
          as="article"
          delay={(index % 3) * 60}
          className="card flex h-full flex-col p-6"
        >
          <Quote className="h-6 w-6 text-accent/40" aria-hidden />
          <blockquote className="mt-4 flex-1 text-step--1 leading-relaxed text-ink-soft">
            “{testimonial.quote}”
          </blockquote>
          <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent-soft text-step--1 font-bold text-accent">
              {testimonial.author.split(" ").slice(0, 2).map((p) => p[0]).join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-step--1 font-semibold">{testimonial.author}</p>
              <p className="truncate text-step--2 text-ink-muted">
                {testimonial.role}
                {testimonial.company ? `, ${testimonial.company}` : ""}
              </p>
            </div>
            <span className="ml-auto flex gap-0.5" role="img" aria-label={`Rated ${testimonial.rating} out of 5`}>
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
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
      <div className="container-x">
        <Reveal className="hero-surface relative overflow-hidden rounded-2xl border border-line px-6 py-14 text-center md:px-16 md:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
            <HexTexture />
          </div>
          <div className="glow-1 -left-20 -top-24 h-72 w-72" aria-hidden />
          <div className="glow-2 -bottom-24 -right-16 h-72 w-72" aria-hidden />
          <div className="relative mx-auto max-w-[46ch]">
            <h2 className="text-step-4 font-extrabold">{content.headline}</h2>
            <p className="mt-4 text-step-0 text-ink-soft">{content.subheadline}</p>
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
