/**
 * The five typefaces an admin can choose between (PRD v5.1 §2).
 *
 * All five are loaded through `next/font` in the root layout and self-hosted at
 * build time, so switching is a settings change rather than a code change and
 * costs no extra network round trip to a font CDN. The chosen pair is applied
 * by pointing the `--font-display` / `--font-body` custom properties at the
 * right family, which is the only place in the codebase that decides a font.
 *
 * Client-safe: no `server-only`, because the settings form renders the picker.
 */
export const FONT_IDS = ["plus-jakarta", "inter", "poppins", "manrope", "geist"] as const;

export type FontId = (typeof FONT_IDS)[number];

export const FONT_META: Record<
  FontId,
  { label: string; description: string; sample: string }
> = {
  "plus-jakarta": {
    label: "Plus Jakarta Sans",
    description: "Geometric and confident. The current default for headings.",
    sample: "Digital work that can be measured",
  },
  inter: {
    label: "Inter",
    description: "Neutral and highly legible at small sizes. Safe for body copy.",
    sample: "Digital work that can be measured",
  },
  poppins: {
    label: "Poppins",
    description: "Round geometric sans. Friendly, works best for headings.",
    sample: "Digital work that can be measured",
  },
  manrope: {
    label: "Manrope",
    description: "Modern and slightly technical. Good for product-led brands.",
    sample: "Digital work that can be measured",
  },
  geist: {
    label: "Geist",
    description: "Clean contemporary grotesque. Pairs well with itself.",
    sample: "Digital work that can be measured",
  },
};

export function isFontId(value: unknown): value is FontId {
  return typeof value === "string" && (FONT_IDS as readonly string[]).includes(value);
}

export type FontPolicy = { headingFont: FontId; bodyFont: FontId };

export const DEFAULT_FONT_POLICY: FontPolicy = {
  headingFont: "plus-jakarta",
  bodyFont: "inter",
};

/** Normalises stored settings so an unknown value can never break rendering. */
export function resolveFontPolicy(raw: unknown): FontPolicy {
  const value = (raw ?? {}) as Partial<FontPolicy>;
  return {
    headingFont: isFontId(value.headingFont) ? value.headingFont : DEFAULT_FONT_POLICY.headingFont,
    bodyFont: isFontId(value.bodyFont) ? value.bodyFont : DEFAULT_FONT_POLICY.bodyFont,
  };
}
