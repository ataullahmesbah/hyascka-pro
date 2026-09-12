import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import localFont from "next/font/local";

import "@/styles/globals.css";

import { ThemeProvider, ThemeScript } from "@/components/ui/theme";
import { ToastProvider } from "@/components/ui/toast";
import type { FontId } from "@/lib/fonts";
import { getFontPolicy, getSettings, getThemePolicy } from "@/lib/settings";
import { pageMetadata, siteUrl } from "@/lib/seo";

/**
 * All five selectable typefaces (PRD v5.1 §2), self-hosted at build time.
 *
 * Declaring a family costs nothing on its own — a browser only downloads a font
 * it actually has to render — so the two an admin has chosen are the two that
 * hit the network. That is what makes the picker in Settings → Theme a real
 * setting rather than a code change.
 *
 * None are preloaded. Preloading is per-family and decided at build time, but
 * the choice is made at runtime, so preloading would mean pulling all five over
 * the wire. `display: "swap"` plus next/font's metric-matched fallback keeps
 * text readable from first paint and the swap costs no layout shift.
 */
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  preload: false,
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const poppins = Poppins({
  subsets: ["latin"],
  // Poppins has no variable build, so the weights the design system uses are
  // named explicitly rather than pulling the whole family.
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});
/*
 * Geist is loaded from the file rather than through `geist/font/sans`, which
 * hard-codes `preload: true`. Importing that package put a 68 KB preload on the
 * critical path of every page, for a family nobody had selected — and because
 * it registers at import time, not at render time, leaving its class off the
 * document did not remove it.
 */
const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  preload: false,
  weight: "100 900",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

/** Maps a stored font id to the custom property that carries its family. */
const FONT_VARIABLE: Record<FontId, string> = {
  "plus-jakarta": "--font-plus-jakarta",
  inter: "--font-inter",
  poppins: "--font-poppins",
  manrope: "--font-manrope",
  geist: "--font-geist-sans",
};

/** The class that defines each family's custom property, by stored id. */
const FONT_CLASS: Record<FontId, string> = {
  "plus-jakarta": plusJakarta.variable,
  inter: inter.variable,
  poppins: poppins.variable,
  manrope: manrope.variable,
  geist: geist.variable,
};

/**
 * Only the two families actually in use are put on the document.
 *
 * Rendering all five classes pulled all five into the page: next/font emits a
 * font's `<link rel="preload">` when its class appears in the tree, and the
 * `geist` package hard-codes preload, so a 68 KB family nobody had selected sat
 * on the critical path of every page. Two classes means two font files.
 */
function fontClassNames(fonts: { headingFont: FontId; bodyFont: FontId }) {
  return [...new Set([FONT_CLASS[fonts.headingFont], FONT_CLASS[fonts.bodyFont]])].join(" ");
}

export async function generateMetadata(): Promise<Metadata> {
  const { seo, brand } = await getSettings();
  const base = await pageMetadata();
  return {
    ...base,
    metadataBase: new URL(siteUrl()),
    title: { default: seo.defaultTitle, template: seo.titleTemplate },
    applicationName: brand.siteName,
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a12" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [policy, fonts] = await Promise.all([getThemePolicy(), getFontPolicy()]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={policy.defaultTheme}
      className={fontClassNames(fonts)}
      // The whole design system reads --font-display and --font-body; pointing
      // them at the chosen families here is the only place a font is decided.
      style={
        {
          "--font-display": `var(${FONT_VARIABLE[fonts.headingFont]})`,
          "--font-body": `var(${FONT_VARIABLE[fonts.bodyFont]})`,
        } as React.CSSProperties
      }
    >
      <head>
        <ThemeScript policy={policy} />
      </head>
      <body className="min-h-dvh bg-bg text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-btn focus:bg-accent focus:px-4 focus:py-2 focus:text-step--1 focus:font-semibold focus:text-accent-ink"
        >
          Skip to content
        </a>
        <ThemeProvider policy={policy}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
