import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The only button in the system. Variants are a closed set so the CMS can
 * expose them safely as options (PRD §5, §18, §47).
 */
const variants = {
  primary:
    "brand-gradient text-white shadow-glow hover:brightness-110 active:brightness-95 border-transparent",
  secondary:
    "bg-foreground text-background hover:bg-foreground/90 border-transparent",
  outline:
    "border-border bg-transparent hover:bg-muted text-foreground",
  ghost: "border-transparent bg-transparent hover:bg-muted text-foreground",
  soft: "border-transparent bg-primary-soft text-primary hover:bg-primary-soft/70",
  danger: "border-transparent bg-danger text-white hover:bg-danger/90",
  link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
  icon: "h-10 w-10 p-0",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

const base =
  "inline-flex select-none items-center justify-center whitespace-nowrap rounded-full border font-semibold transition-[transform,background-color,box-shadow,filter] duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-55 motion-reduce:hover:translate-y-0";

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
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
