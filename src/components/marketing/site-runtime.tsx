"use client";

import * as React from "react";

/**
 * Every piece of interactive behaviour on the public site, in one effect.
 *
 * Scroll reveals and the hero slider are a few dozen lines of DOM work each.
 * As React components they cost a client boundary per element and a hydration
 * pass over the biggest subtree on the page — forty boundaries on the homepage,
 * and about 14 kB of JavaScript for the hero alone. As an inline <script> they
 * were cheaper still, but they intermittently collided with hydration: React 19
 * relocates script elements during server rendering and streams hydration in
 * slices, so a script that touches server-rendered markup will sooner or later
 * land mid-hydration, and React responds by discarding the server HTML and
 * re-rendering everything.
 *
 * One client component with one effect is the compromise: the markup stays
 * server-rendered, effects are guaranteed to run after hydration, and the whole
 * page shares a single IntersectionObserver. Each block no-ops when its markup
 * is absent, so this serves every marketing route.
 */
export function SiteRuntime() {
  React.useEffect(() => {
    const cleanups: Array<() => void> = [];
    const add = (cleanup: (() => void) | null) => {
      if (cleanup) cleanups.push(cleanup);
    };

    add(setUpHero());
    add(setUpReveals());

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}

/**
 * Reveals elements as they scroll in.
 *
 * Only elements below the fold are armed — anything already on screen is never
 * hidden, which keeps the largest contentful paint off the hydration path. The
 * positions come from the observer's own first callback rather than a manual
 * `getBoundingClientRect`, because the observer waits for real layout.
 *
 * It waits for the page to actually have a layout first. Effects in the root
 * layout can run while React is still hydrating the nested route boundary, and
 * React keeps that subtree hidden meanwhile — measure then and the entire page
 * reads as a zero-height block sitting above the fold, so nothing is ever
 * armed. Roughly a quarter of cold loads landed in that window.
 */
function setUpReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!nodes.length) return null;

  const measured = new WeakSet<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;

        if (!measured.has(element)) {
          measured.add(element);
          // Above the fold: leave it visible and stop watching it.
          if (entry.boundingClientRect.top < window.innerHeight * 1.15) {
            observer.unobserve(element);
          } else {
            element.setAttribute("data-armed", "");
          }
          continue;
        }

        if (!entry.isIntersecting) continue;
        observer.unobserve(element);
        element.setAttribute("data-shown", "");
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  // Give up after ~2s of never getting a layout; every reveal simply stays
  // visible, which is the same as the no-JavaScript rendering.
  let frame = 0;
  let attempts = 0;
  const last = nodes[nodes.length - 1];
  const start = () => {
    if (last.getBoundingClientRect().height === 0 && attempts++ < 120) {
      frame = requestAnimationFrame(start);
      return;
    }
    nodes.forEach((node) => observer.observe(node));
  };
  start();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}

/**
 * Hero slider.
 *
 * Sets one attribute — `data-active` on the section — and lets CSS do the rest
 * (see globals.css). Without it the first slide shows, so the hero is complete
 * before any JavaScript runs.
 */
function setUpHero() {
  const root = document.querySelector<HTMLElement>("[data-hero]");
  if (!root) return null;

  const count = Number(root.getAttribute("data-hero-count") ?? 0);
  if (count < 2) return null;

  const interval = Math.max(3500, Number(root.getAttribute("data-interval")) || 6000);
  const autoplay =
    root.getAttribute("data-autoplay") === "1" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let index = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const show = (next: number) => {
    index = ((next % count) + count) % count;
    root.setAttribute("data-active", String(index));
  };
  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
  const start = () => {
    if (autoplay && !timer) timer = setInterval(() => show(index + 1), interval);
  };
  const restart = () => {
    stop();
    start();
  };

  const onClick = (event: MouseEvent) => {
    const target = (event.target as Element | null)?.closest("[data-hero-go],[data-hero-step]");
    if (!(target instanceof HTMLElement)) return;
    const goTo = target.getAttribute("data-hero-go");
    show(goTo === null ? index + Number(target.getAttribute("data-hero-step")) : Number(goTo));
    restart();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") show(index - 1);
    else if (event.key === "ArrowRight") show(index + 1);
    else return;
    restart();
  };

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  start();

  return () => {
    stop();
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("mouseenter", stop);
    root.removeEventListener("mouseleave", start);
    root.removeEventListener("focusin", stop);
    root.removeEventListener("focusout", start);
  };
}
