import * as React from "react";
import Image from "next/image";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export type HeroSlide = {
  id: string;
  eyebrow: string;
  headline: string;
  /** A single word/phrase inside the headline that takes the accent colour. */
  highlight?: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  imageUrl?: string;
};

export type HeroContent = {
  autoplay: boolean;
  intervalMs: number;
  slides: HeroSlide[];

  /** The chooser, and everything behind its second option. */
  chooserLabel?: string;
  agencyLabel?: string;
  consultingLabel?: string;
  consultingEyebrow?: string;
  consultingHeadline?: string;
  consultingHighlight?: string;
  consultingSubheadline?: string;
  /** Three or four short lines: what we actually do on this side. */
  consultingPoints?: string[];
  consultingPrimaryCta?: { label: string; href: string };
  consultingSecondaryCta?: { label: string; href: string };
  clients?: string[];
};

/**
 * Renders the headline with exactly one accent-coloured span. Gradient headings
 * were retired in v5 — emphasis now comes from weight and a single accent word
 * (PRD §2), which is what fixed the "tiring to read" problem.
 */
function Headline({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) return <>{text}</>;
  const [before, ...rest] = text.split(highlight);
  return (
    <>
      {before}
      <span className="accent-text">{highlight}</span>
      {rest.join(highlight)}
    </>
  );
}

export function Hero({
  content,
  visuals,
  consultingVisual,
}: {
  content: HeroContent;
  /** One per slide. Fewer than there are slides and the last one repeats. */
  visuals: React.ReactNode[];
  /** The artwork beside the consulting panel — our network, not a card grid. */
  consultingVisual?: React.ReactNode;
}) {
  const slides = content.slides;
  const count = slides.length;
  if (!count) return null;

  const clients = content.clients ?? [];
  const points = content.consultingPoints ?? [];
  const consultingHeadline = content.consultingHeadline?.trim();
  /*
   * The chooser only appears when there is a second thing to choose. An install
   * that has not filled the consulting side in gets the plain hero it had
   * before, rather than a toggle leading to an empty panel.
   */
  const hasConsulting = Boolean(consultingHeadline);

  // Each slide gets its own pane, so the artwork changes with the message
  // rather than one globe sitting through all three. A slide with an uploaded
  // image uses that; otherwise it falls back to the visual for its position.
  const visualFor = (index: number) => visuals[Math.min(index, visuals.length - 1)] ?? null;

  return (
    <section
      data-hero=""
      data-hero-count={count}
      data-autoplay={content.autoplay ? "1" : "0"}
      data-interval={content.intervalMs}
      aria-roledescription={count > 1 ? "carousel" : undefined}
      aria-label={count > 1 ? "Introduction" : undefined}
      tabIndex={-1}
      className="hero-surface relative overflow-hidden border-b border-line"
    >
      <div className="grid-texture pointer-events-none absolute inset-0" aria-hidden />
      <div className="glow-1 -left-40 -top-32 h-[26rem] w-[26rem]" aria-hidden />
      <div className="glow-2 -right-24 top-24 h-[22rem] w-[22rem]" aria-hidden />

      {hasConsulting ? (
        <div className="container-x relative pt-8 md:pt-10">
          {/*
            Two radios and their labels — no JavaScript. Which panel shows is
            decided in CSS from :checked, so the choice survives a slow network
            and works before hydration, which is exactly when a visitor is
            deciding whether to stay.
          */}
          <div
            role="radiogroup"
            aria-label={content.chooserLabel || "I am looking for"}
            className="hy-hero-chooser mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-pill border border-line bg-surface/80 p-1 shadow-sm backdrop-blur"
          >
            <span className="hidden px-2.5 text-step--2 text-ink-muted sm:block">
              {content.chooserLabel || "I'm looking for"}
            </span>
            <input
              type="radio"
              name="hy-hero-mode"
              id="hy-hero-agency"
              defaultChecked
              className="sr-only"
            />
            <label htmlFor="hy-hero-agency" className="hy-hero-tab">
              {content.agencyLabel || "HYASCKA"}
            </label>
            <input type="radio" name="hy-hero-mode" id="hy-hero-consulting" className="sr-only" />
            <label htmlFor="hy-hero-consulting" className="hy-hero-tab">
              {content.consultingLabel || "Consulting & Services"}
            </label>
          </div>
        </div>
      ) : null}

      <div
        data-hero-mode="agency"
        className="container-x relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:py-24"
      >
        {/* Announced as slides swap; visibility is CSS, driven by data-active. */}
        <div aria-live="polite">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              data-hero-slide={index}
              className="animate-fade-up"
            >
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-pill bg-success" />
                {slide.eyebrow}
              </span>

              <h1 className="mt-5 max-w-[18ch] text-step-5 font-bold tracking-tight">
                <Headline text={slide.headline} highlight={slide.highlight} />
              </h1>

              <p className="mt-5 max-w-[54ch] text-step-1 leading-relaxed text-ink-soft">
                {slide.subheadline}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href={slide.primaryCta.href}
                  size="lg"
                  data-track-event="cta_click"
                  data-track-location="hero"
                  data-track-label={slide.primaryCta.label}
                >
                  {slide.primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href={slide.secondaryCta.href} variant="outline" size="lg">
                  {slide.secondaryCta.label}
                </ButtonLink>
              </div>
            </div>
          ))}

          {count > 1 ? (
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                data-hero-step="-1"
                aria-label="Previous slide"
                className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-line-strong text-ink-soft transition-colors duration-fast hover:border-accent-border hover:bg-surface-2 hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {slides.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    data-hero-go={i}
                    aria-label={`Show slide ${i + 1}: ${item.eyebrow}`}
                    className="group/dot flex h-6 items-center px-1"
                  >
                    <span className="hero-dot" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                data-hero-step="1"
                aria-label="Next slide"
                className="inline-flex h-9 w-9 items-center justify-center rounded-btn border border-line-strong text-ink-soft transition-colors duration-fast hover:border-accent-border hover:bg-surface-2 hover:text-ink"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative mx-auto w-full max-w-[34rem]">
          {slides.map((slide, index) => (
            <div key={slide.id} data-hero-pane={index}>
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  alt=""
                  width={900}
                  height={900}
                  priority={index === 0}
                  sizes="(max-width: 1024px) 80vw, 30rem"
                  className="rounded-xl border border-line object-cover shadow-lg"
                />
              ) : (
                visualFor(index)
              )}
            </div>
          ))}
        </div>
      </div>

      {hasConsulting ? (
        /*
         * Deliberately shorter than the agency panel: this side is a statement
         * of who we are and who we work with, not a second landing page. The
         * service cards that used to sit here were taller than the viewport on
         * a laptop and duplicated /services three sections further down.
         */
        <div
          data-hero-mode="consulting"
          className="container-x relative grid items-center gap-10 py-10 md:py-14 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:py-16"
        >
          <div>
            <span className="eyebrow">
              <span className="h-1.5 w-1.5 rounded-pill bg-accent" />
              {content.consultingEyebrow || "Consulting & Services"}
            </span>

            <h2 className="mt-4 max-w-[20ch] text-step-3 font-bold tracking-tight">
              <Headline text={consultingHeadline ?? ""} highlight={content.consultingHighlight} />
            </h2>

            {content.consultingSubheadline ? (
              <p className="mt-4 max-w-[52ch] text-step-0 leading-relaxed text-ink-soft">
                {content.consultingSubheadline}
              </p>
            ) : null}

            {points.length ? (
              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {points.slice(0, 6).map((point) => (
                  <li key={point} className="flex items-start gap-2 text-step--1 text-ink-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {content.consultingPrimaryCta?.label ? (
                <ButtonLink
                  href={content.consultingPrimaryCta.href}
                  data-track-event="cta_click"
                  data-track-location="hero_consulting"
                  data-track-label={content.consultingPrimaryCta.label}
                >
                  {content.consultingPrimaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              ) : null}
              {content.consultingSecondaryCta?.label ? (
                <ButtonLink href={content.consultingSecondaryCta.href} variant="outline">
                  {content.consultingSecondaryCta.label}
                </ButtonLink>
              ) : null}
            </div>

            {/*
              Names, set as a quiet wordmark row. Plates rather than logo files:
              a logo needs permission and a transparent PNG per brand, and this
              says the same thing without either.
            */}
            {clients.length ? (
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-step--2 uppercase tracking-wider text-ink-muted">
                  Teams we work with
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {clients.slice(0, 6).map((client) => (
                    <li
                      key={client}
                      className="rounded-btn border border-line bg-surface/70 px-3 py-1.5 text-step--2 font-semibold tracking-wide text-ink-soft"
                    >
                      {client}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {consultingVisual ? (
            <div className="relative mx-auto w-full max-w-[34rem]">{consultingVisual}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
