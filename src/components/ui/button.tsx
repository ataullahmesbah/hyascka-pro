import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The only button in the product.
 *
 * Variants are a closed set so the CMS can expose them safely, and every colour
 * resolves through the theme tokens — which is why the same component looks
 * correct on Daylight, Midnight and Network without a single conditional.
 */
const VARIANTS = {
  primary:
    "bg-accent text-accent-ink shadow-accent hover:bg-accent-hover active:translate-y-px border border-transparent",
  secondary:
    "bg-ink text-ink-inverse hover:bg-ink/90 active:translate-y-px border border-transparent",
  outline:
    "bg-transparent text-ink border border-line-strong hover:bg-surface-2 hover:border-accent-border active:translate-y-px",
  ghost:
    "bg-transparent text-ink-soft border border-transparent hover:bg-surface-2 hover:text-ink active:translate-y-px",
  soft:
    "bg-accent-soft text-accent border border-transparent hover:bg-accent-soft/70 active:translate-y-px",
  danger:
    "bg-danger text-white border border-transparent hover:bg-danger/90 active:translate-y-px",
  link:
    "bg-transparent text-accent border-0 p-0 h-auto underline-offset-4 hover:underline shadow-none",
} as const;

const SIZES = {
  sm: "h-9 px-3.5 text-step--1 gap-1.5 rounded-btn",
  md: "h-[2.625rem] px-5 text-step--1 gap-2 rounded-btn",
  lg: "h-[3.125rem] px-7 text-step-0 gap-2.5 rounded-btn",
  icon: "h-10 w-10 p-0 rounded-btn",
  "icon-sm": "h-9 w-9 p-0 rounded-btn",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

const BASE =
  "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold " +
  "transition-[background-color,border-color,box-shadow,transform,color] duration-fast ease-out " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "motion-reduce:active:translate-y-0";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />;
});

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

/** Anchor-flavoured button for external links and downloads. */
export function ButtonAnchor({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <a className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </a>
  );
}
