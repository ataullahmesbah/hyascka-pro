import * as React from "react";

import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-btn border border-line-strong bg-surface px-3.5 py-2.5 text-step--1 text-ink " +
  "shadow-xs transition-[border-color,box-shadow] duration-fast " +
  "placeholder:text-ink-muted/70 " +
  "hover:border-accent-border " +
  "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 " +
  "disabled:cursor-not-allowed disabled:opacity-55 disabled:bg-surface-2";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, "h-[2.625rem]", className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(CONTROL, "resize-y leading-relaxed", className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(CONTROL, "h-[2.625rem] cursor-pointer appearance-none pr-10", className)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
});

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("text-step--1 font-medium text-ink", className)} {...props}>
      {children}
      {required ? <span className="ml-0.5 text-danger">*</span> : null}
    </label>
  );
}

/**
 * One field wrapper for the whole product: label, inline guidance for technical
 * fields, and the server-side error. Non-developers get an explanation next to
 * anything jargon-shaped (slug, meta description, pixel ID).
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string[] | string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const message = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      ) : null}
      {children}
      {hint && !message ? <p className="text-step--2 text-ink-muted">{hint}</p> : null}
      {message ? (
        <p className="text-step--2 font-medium text-danger" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-[1.05rem] w-[1.05rem] shrink-0 cursor-pointer rounded-xs border border-line-strong",
        "accent-[hsl(var(--accent))] transition-colors hover:border-accent",
        className,
      )}
      {...props}
    />
  );
}

/** Accessible switch used across settings, integrations and feature flags. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-pill border transition-colors duration-fast",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-accent bg-accent" : "border-line-strong bg-surface-3",
      )}
    >
      <span
        className={cn(
          "absolute top-[0.15rem] h-[1.15rem] w-[1.15rem] rounded-pill bg-white shadow-sm transition-transform duration-fast",
          checked ? "translate-x-[1.35rem]" : "translate-x-[0.15rem]",
        )}
      />
    </button>
  );
}
