/**
 * The closed set of themes. A theme is a block of tokens in
 * `src/styles/tokens.css` — never free-form CSS entered by a user (PRD §11).
 */
export const THEMES = ["light", "midnight", "network"] as const;

export type ThemeId = (typeof THEMES)[number];

export const THEME_META: Record<
  ThemeId,
  { label: string; description: string; scheme: "light" | "dark"; swatch: string }
> = {
  light: {
    label: "Daylight",
    description: "Clean editorial light — the default experience.",
    scheme: "light",
    swatch: "#ffffff",
  },
  midnight: {
    label: "Midnight",
    description: "Near-black with a violet accent and restrained glow.",
    scheme: "dark",
    swatch: "#0a0a12",
  },
  network: {
    label: "Network",
    description: "Deep navy with electric blue and a hexagon texture.",
    scheme: "dark",
    swatch: "#060f22",
  },
};

export const THEME_STORAGE_KEY = "hyascka.theme";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export type ThemePolicy = {
  /** What a first-time visitor sees. */
  defaultTheme: ThemeId;
  /** Which themes appear in the visitor's toggle. */
  enabledThemes: ThemeId[];
  /** When false the toggle disappears and everyone is locked to defaultTheme. */
  allowUserToggle: boolean;
};

/**
 * Normalises whatever is stored in settings into a policy that cannot produce
 * an unusable state (empty list, default not in the list, and so on).
 */
export function resolveThemePolicy(input: Partial<ThemePolicy> | null | undefined): ThemePolicy {
  const enabled = (input?.enabledThemes ?? []).filter(isThemeId);
  const list = enabled.length ? Array.from(new Set(enabled)) : [...THEMES];
  const requested = isThemeId(input?.defaultTheme) ? input!.defaultTheme! : "light";
  const defaultTheme = list.includes(requested) ? requested : list[0];

  return {
    defaultTheme,
    enabledThemes: list,
    // A toggle over a single option is not a choice — hide it automatically.
    allowUserToggle: (input?.allowUserToggle ?? true) && list.length > 1,
  };
}
