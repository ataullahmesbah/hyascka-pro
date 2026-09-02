import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

/** Branded 404 consistent with the design system (PRD §39.6). */
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-[36rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
        aria-hidden
      />
      <div className="relative max-w-lg text-center">
        <LogoMark size={64} className="mx-auto" />
        <p className="accent-text mt-8 font-display text-7xl font-extrabold">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold">This page does not exist</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The link may be out of date, or the page may have moved. Everything below is a good place
          to pick up from.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/services" variant="outline">
            Browse services
          </ButtonLink>
        </div>
        <p className="mt-6 text-xs text-ink-muted">
          Think this is a mistake?{" "}
          <Link href="/contact" className="text-accent underline-offset-4 hover:underline">
            Tell us
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
