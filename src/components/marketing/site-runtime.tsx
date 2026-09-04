"use client";

import * as React from "react";

/**
 * The public site's interactive behaviour, in one effect.
 *
 * Only the hero slider lives here now. Scroll reveals used to as well, and they
 * were the source of a hydration mismatch: marking each element as it came into
 * view meant the client tree really did differ from the server HTML, and React
 * recovered by throwing the server render away. They are pure CSS now (see the
 * scroll-driven animation in globals.css), which removes the mutation rather
 * than trying to time it.
 *
 * The hero markup stays server-rendered and this only sets one attribute on the
 * section, and only in response to a click, a key or the autoplay timer — all
 * of which happen long after hydration.
 */
export function SiteRuntime() {
  React.useEffect(() => {
    const cleanups: Array<() => void> = [];
    const add = (cleanup: (() => void) | null) => {
      if (cleanup) cleanups.push(cleanup);
    };

    add(setUpHero());

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
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
