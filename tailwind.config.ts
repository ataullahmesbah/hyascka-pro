import type { Config } from "tailwindcss";

/**
 * Tailwind consumes the token layer in `src/styles/tokens.css` — it never
 * defines a colour of its own. Swapping `data-theme` on <html> re-skins the
 * entire product because every utility resolves through these variables.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1.25rem", screens: { "2xl": "76rem" } },
    extend: {
      colors: {
        bg: "hsl(var(--bg) / <alpha-value>)",
        "bg-subtle": "hsl(var(--bg-subtle) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-2": "hsl(var(--surface-2) / <alpha-value>)",
        "surface-3": "hsl(var(--surface-3) / <alpha-value>)",
        ink: "hsl(var(--ink) / <alpha-value>)",
        "ink-soft": "hsl(var(--ink-soft) / <alpha-value>)",
        "ink-muted": "hsl(var(--ink-muted) / <alpha-value>)",
        "ink-inverse": "hsl(var(--ink-inverse) / <alpha-value>)",
        line: "hsl(var(--line) / <alpha-value>)",
        "line-strong": "hsl(var(--line-strong) / <alpha-value>)",
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          hover: "hsl(var(--accent-hover) / <alpha-value>)",
          ink: "hsl(var(--accent-ink) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
          border: "hsl(var(--accent-border) / <alpha-value>)",
        },
        success: { DEFAULT: "hsl(var(--success) / <alpha-value>)", soft: "hsl(var(--success-soft) / <alpha-value>)" },
        warning: { DEFAULT: "hsl(var(--warning) / <alpha-value>)", soft: "hsl(var(--warning-soft) / <alpha-value>)" },
        danger: { DEFAULT: "hsl(var(--danger) / <alpha-value>)", soft: "hsl(var(--danger-soft) / <alpha-value>)" },
        info: { DEFAULT: "hsl(var(--info) / <alpha-value>)", soft: "hsl(var(--info-soft) / <alpha-value>)" },
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "ui-sans-serif", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        "step--2": "var(--step--2)",
        "step--1": "var(--step--1)",
        "step-0": "var(--step-0)",
        "step-1": "var(--step-1)",
        "step-2": "var(--step-2)",
        "step-3": "var(--step-3)",
        "step-4": "var(--step-4)",
        "step-5": "var(--step-5)",
        "step-6": "var(--step-6)",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        btn: "var(--radius-btn)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        accent: "var(--shadow-accent)",
      },
      spacing: {
        "2xs": "var(--space-2xs)",
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
        "3xl": "var(--space-3xl)",
        header: "var(--header-h)",
      },
      maxWidth: { container: "var(--container)", prose: "68ch" },
      transitionTimingFunction: { out: "var(--ease-out)", "in-out": "var(--ease-in-out)" },
      transitionDuration: { fast: "var(--dur-fast)", DEFAULT: "var(--dur)", slow: "var(--dur-slow)" },
      animation: {
        "fade-up": "hy-fade-up 0.55s var(--ease-out) both",
        "fade-in": "hy-fade-in 0.35s var(--ease-out) both",
        "scale-in": "hy-scale-in 0.2s var(--ease-out) both",
        float: "hy-float 6s ease-in-out infinite",
      },
      zIndex: { header: "50", consent: "55", drawer: "60", modal: "70", toast: "100" },
    },
  },
  plugins: [],
};

export default config;
