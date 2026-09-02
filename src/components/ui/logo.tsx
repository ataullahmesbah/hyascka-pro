import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Navbar lockup: the icon mark at a fixed height beside a wordmark set in type.
 *
 * The wordmark is solid ink rather than a gradient — gradient text was the
 * single biggest readability complaint in v4 (PRD §2). Colour lives in the mark,
 * which is where it belongs and where it survives on light and dark grounds
 * alike.
 */
export function Logo({
  href = "/",
  className,
  wordmark = true,
  size = 30,
  siteName = "HYASCKA",
  tagline,
}: {
  href?: string;
  className?: string;
  wordmark?: boolean;
  size?: number;
  siteName?: string;
  tagline?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex shrink-0 items-center gap-2.5", className)}
      // Only label the link when the wordmark is hidden; otherwise the visible
      // text is the accessible name and an aria-label would conflict with it.
      aria-label={wordmark ? undefined : `${siteName} home`}
    >
      <LogoMark size={size} />
      {wordmark ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.05rem] font-bold tracking-[0.16em] text-ink">
            {siteName}
          </span>
          {tagline ? (
            <span className="mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-muted">
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * The faceted H. Geometry only — no filters, no blur — so it stays crisp from a
 * 16px favicon to a hero-scale render.
 */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hy-mark-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="hy-mark-r" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
        <linearGradient id="hy-mark-bar" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="52%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Left upright with a bevelled top face */}
      <path d="M104 132 L176 96 L176 424 L104 424 Z" fill="url(#hy-mark-l)" />
      <path d="M104 132 L176 96 L176 132 L104 168 Z" fill="#ffffff" opacity="0.32" />

      {/* Diagonal crossbar */}
      <path d="M152 316 L360 196 L360 268 L152 388 Z" fill="url(#hy-mark-bar)" />
      <path d="M152 316 L360 196 L360 214 L152 334 Z" fill="#ffffff" opacity="0.2" />

      {/* Right upright */}
      <path d="M336 96 L408 132 L408 424 L336 424 Z" fill="url(#hy-mark-r)" />
      <path d="M336 96 L408 132 L408 168 L336 132 Z" fill="#ffffff" opacity="0.26" />
    </svg>
  );
}
