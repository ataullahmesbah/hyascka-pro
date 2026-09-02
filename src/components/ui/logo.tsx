import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Navbar lockup per PRD §51.3: the icon-only mark at a fixed height beside the
 * wordmark as text — never the tall stacked lockup.
 */
export function Logo({
  href = "/",
  className,
  wordmark = true,
  size = 36,
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
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${siteName} home`}
    >
      <LogoMark size={size} />
      {wordmark ? (
        <span className="flex flex-col leading-none">
          <span className="brand-text font-display text-lg font-extrabold tracking-[0.14em]">
            {siteName}
          </span>
          {tagline ? (
            <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {tagline}
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}

/** The faceted H mark, inline so it inherits crisp rendering at any size. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn("shrink-0 transition-transform duration-300 group-hover:scale-105", className)}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hy-nav-left" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E4FF" />
          <stop offset="100%" stopColor="#1E7BF0" />
        </linearGradient>
        <linearGradient id="hy-nav-right" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B4BF7" />
          <stop offset="100%" stopColor="#4B39E0" />
        </linearGradient>
        <linearGradient id="hy-nav-bar" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#19C8FB" />
          <stop offset="55%" stopColor="#3E71F4" />
          <stop offset="100%" stopColor="#7A47F1" />
        </linearGradient>
      </defs>
      <path d="M104 132 L176 96 L176 424 L104 424 Z" fill="url(#hy-nav-left)" />
      <path d="M104 132 L176 96 L176 132 L104 168 Z" fill="#ffffff" opacity="0.34" />
      <path d="M152 316 L360 196 L360 268 L152 388 Z" fill="url(#hy-nav-bar)" />
      <path d="M336 96 L408 132 L408 424 L336 424 Z" fill="url(#hy-nav-right)" />
      <path d="M336 96 L408 132 L408 168 L336 132 Z" fill="#ffffff" opacity="0.28" />
    </svg>
  );
}
