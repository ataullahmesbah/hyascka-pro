import { cache } from "react";

import { prisma, withFallback } from "@/lib/db";
import {
  defaultBrand,
  defaultContact,
  defaultFeatureFlags,
  defaultLocalization,
  defaultMaintenance,
  defaultNotifications,
  defaultSeo,
  defaultSocial,
  defaultTheme,
  defaultTracking,
} from "@/content/site";

/**
 * Every dashboard-controllable system reads through here (PRD §46). Values are
 * structured JSON written by validated forms — never raw CSS or code.
 */
export type SiteSettings = {
  brand: typeof defaultBrand;
  theme: typeof defaultTheme;
  contact: typeof defaultContact;
  social: typeof defaultSocial;
  seo: typeof defaultSeo;
  tracking: typeof defaultTracking;
  maintenance: typeof defaultMaintenance;
  notifications: typeof defaultNotifications;
  localization: typeof defaultLocalization;
  featureFlags: Record<string, boolean>;
};

export const SETTING_KEYS = [
  "brand",
  "theme",
  "contact",
  "social",
  "seo",
  "tracking",
  "maintenance",
  "notifications",
  "localization",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

const DEFAULTS: Omit<SiteSettings, "featureFlags"> = {
  brand: defaultBrand,
  theme: defaultTheme,
  contact: defaultContact,
  social: defaultSocial,
  seo: defaultSeo,
  tracking: defaultTracking,
  maintenance: defaultMaintenance,
  notifications: defaultNotifications,
  localization: defaultLocalization,
};

function defaultFlags(): Record<string, boolean> {
  return Object.fromEntries(defaultFeatureFlags.map((flag) => [flag.key, flag.enabled]));
}

/** Request-deduplicated read; the underlying page is cached/revalidated. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const fallback: SiteSettings = { ...DEFAULTS, featureFlags: defaultFlags() };

  return withFallback(async () => {
    const [rows, flags] = await Promise.all([
      prisma.siteSetting.findMany(),
      prisma.featureFlag.findMany(),
    ]);

    const merged: SiteSettings = { ...fallback };
    for (const row of rows) {
      if ((SETTING_KEYS as readonly string[]).includes(row.key)) {
        const key = row.key as SettingKey;
        const base = DEFAULTS[key];
        merged[key] = (
          Array.isArray(base) ? (row.value ?? base) : { ...(base as object), ...(row.value as object) }
        ) as never;
      }
    }
    if (flags.length) {
      merged.featureFlags = Object.fromEntries(flags.map((f) => [f.key, f.enabled]));
    }
    return merged;
  }, fallback);
});

export async function getSetting<K extends SettingKey>(key: K): Promise<SiteSettings[K]> {
  const settings = await getSettings();
  return settings[key];
}

export async function isFeatureEnabled(key: string) {
  const settings = await getSettings();
  return Boolean(settings.featureFlags[key]);
}

/** Server-only tracking secrets never travel to the browser (PRD §44.2). */
export async function getServerTrackingConfig() {
  return withFallback(
    async () => prisma.trackingConfig.findUnique({ where: { id: "singleton" } }),
    null,
  );
}
