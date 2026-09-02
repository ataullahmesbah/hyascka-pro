import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import "@/styles/globals.css";

import { ThemeProvider, ThemeScript } from "@/components/ui/theme";
import { ToastProvider } from "@/components/ui/toast";
import { getSettings, getThemePolicy } from "@/lib/settings";
import { pageMetadata, siteUrl } from "@/lib/seo";

/**
 * Two families only, both variable, both self-hosted at build time (PRD §2).
 * Plus Jakarta Sans carries the headings; Inter does the reading.
 */
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  // No weight array: this pulls the variable font, which is one file covering
  // every weight instead of four separate downloads.
  //
  // This one *is* preloaded: it sets every heading, and measurement showed
  // pulling it forward is worth the bytes. Inter (below) is not — see there.
  preload: true,
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  // Not preloaded on purpose. Inter's variable latin file is ~50 kB, and on a
  // throttled mobile connection preloading it competes with the HTML and CSS
  // for the same pipe. `swap` plus next/font's metric-matched fallback means
  // text is readable immediately and the swap costs no layout shift.
  preload: false,
});

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
  const policy = await getThemePolicy();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={policy.defaultTheme}
      className={`${body.variable} ${display.variable}`}
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
