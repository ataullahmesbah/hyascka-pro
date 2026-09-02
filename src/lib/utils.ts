import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge has to be told about our custom scales.
 *
 * Without this it cannot tell `text-step--1` (a font size) from `text-accent-ink`
 * (a colour) — they share the `text-` prefix — so it treats them as conflicting
 * and silently drops one. That produced buttons rendering dark ink on the accent
 * fill, a real contrast failure caught by the accessibility audit. Declaring the
 * scales removes the ambiguity.
 */
const FONT_SIZES = [
  "step--2", "step--1", "step-0", "step-1", "step-2", "step-3", "step-4", "step-5", "step-6",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZES }],
      "text-color": [
        {
          text: [
            "ink", "ink-soft", "ink-muted", "ink-inverse",
            "accent", "accent-hover", "accent-ink", "accent-soft", "accent-border",
            "success", "warning", "danger", "info",
            "bg", "bg-subtle", "surface", "surface-2", "surface-3", "line", "line-strong",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const CURRENCY_LOCALE: Record<string, string> = {
  BDT: "en-BD",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "BDT",
  options: Intl.NumberFormatOptions = {},
) {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    ...options,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDate(value: Date | string | null | undefined, withTime = false) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function relativeTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

/** Human-readable, collision-resistant business reference (LEAD-8F3K2Q). */
export function reference(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return `${prefix}-${out}`;
}

export function truncate(input: string, length = 140) {
  return input.length <= length ? input : `${input.slice(0, length - 1).trimEnd()}…`;
}

export function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Serialize Prisma Decimal/Date values for Client Components. */
export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
