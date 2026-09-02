"use client";

import * as React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowRight, Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme";
import { trackEvent } from "@/components/marketing/tracking";
import type { homepage } from "@/content/site";

/** Loaded only in the browser, and only once the hero is on screen (§51.2). */
const HeroCanvas = dynamic(() => import("@/components/marketing/hero-canvas"), { ssr: false });

export function Hero({ content }: { content: typeof homepage.hero }) {
  const { accent } = useTheme();
  const [show3d, setShow3d] = React.useState(false);
  const stageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow3d(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -left-32 -top-24 h-[30rem] w-[30rem] rounded-full bg-primary/22 blur-[130px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-40 h-[26rem] w-[26rem] rounded-full bg-accent/18 blur-[130px]"
        aria-hidden
      />

      <div className="container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 lg:py-28">
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {content.eyebrow}
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-[3.85rem]">
            {content.headline}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {content.subheadline}
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5">
            {content.highlights.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href={content.primaryCta.href}
              size="lg"
              onClick={() => trackEvent("cta_click", { location: "hero", label: content.primaryCta.label })}
            >
              {content.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href={content.secondaryCta.href} variant="outline" size="lg">
              {content.secondaryCta.label}
            </ButtonLink>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">{content.trustMicrocopy}</p>
        </div>

        <div ref={stageRef} className="relative mx-auto aspect-square w-full max-w-[30rem]">
          <div
            className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 blur-3xl"
            aria-hidden
          />
          {/* Static mark: the fallback for reduced motion and any device where
              WebGL fails to initialise. The canvas layers over it. */}
          <Image
            src="/brand/hero-fallback.png"
            alt=""
            width={900}
            height={900}
            priority
            fetchPriority="high"
            sizes="(max-width: 1024px) 80vw, 30rem"
            className="relative h-full w-full animate-float object-contain motion-reduce:animate-none"
          />
          {show3d ? <HeroCanvas accent={accent} /> : null}
        </div>
      </div>
    </section>
  );
}
