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
  trustMicrocopy: string;
  highlights: string[];
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
}: {
  content: HeroContent;
  /** One per slide. Fewer than there are slides and the last one repeats. */
  visuals: React.ReactNode[];
}) {
  const slides = content.slides;
  const count = slides.length;
  if (!count) return null;

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

      <div className="container-x relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:py-24">
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

          {/* Shared across slides: the proof points never change between them. */}
          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
            {content.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-step--1 text-ink-muted">
                <Check className="h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-step--2 text-ink-muted">{content.trustMicrocopy}</p>

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
    </section>
  );
}
