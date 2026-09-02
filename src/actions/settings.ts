"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { SETTING_KEYS, type SettingKey } from "@/lib/settings";
import {
  brandSettingsSchema,
  contactSettingsSchema,
  maintenanceSettingsSchema,
  paymentMethodSchema,
  seoSettingsSchema,
  themeSettingsSchema,
  toActionState,
  trackingSettingsSchema,
  type ActionState,
} from "@/lib/validation";

/**
 * Settings writes (PRD §46). Each key has its own schema, so the panel can only
 * ever store structured, validated values — there is no field anywhere here
 * that accepts CSS, HTML or script (§47).
 */
async function writeSetting(key: SettingKey, value: unknown, summary: string, permission: "settings.manage" | "settings.security" = "settings.manage") {
  const user = await authorize(permission);
  if (!(SETTING_KEYS as readonly string[]).includes(key)) throw new Error("Unknown setting.");

  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: value as object, updatedBy: user.id },
    create: { key, value: value as object, updatedBy: user.id },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "settings.update",
    entityType: "SiteSetting",
    entityId: key,
    summary,
  });

  // Public pages are ISR-cached; publishing a setting revalidates them now
  // rather than waiting for the window to expire (PRD §40.1).
  revalidatePath("/", "layout");
  revalidatePath("/dashboard/settings");
  return user;
}

export async function saveBrandSettings(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = brandSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  await writeSetting("brand", parsed.data, "Brand settings updated");
  return { ok: true, message: "Brand settings saved." };
}

export async function saveThemeSettings(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = themeSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  await writeSetting("theme", parsed.data, `Theme set to ${parsed.data.accent}/${parsed.data.mode}`);
  return { ok: true, message: "Theme saved. New visitors see it immediately." };
}

export async function saveContactSettings(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = contactSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  await writeSetting("contact", parsed.data, "Contact details updated");
  return { ok: true, message: "Contact details saved." };
}

export async function saveSeoSettings(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = seoSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  await writeSetting("seo", parsed.data, "SEO defaults updated");
  return { ok: true, message: "SEO defaults saved." };
}

export async function saveTrackingSettings(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = trackingSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { metaCapiToken, metaDatasetId, ...browserIds } = parsed.data;

  // Browser-side IDs are public; the CAPI token is server-side only and is
  // never written into the settings blob that reaches the client (§44.2).
  const user = await writeSetting("tracking", browserIds, "Tracking IDs updated");

  await prisma.trackingConfig.upsert({
    where: { id: "singleton" },
    update: {
      ga4Id: browserIds.ga4Id || null,
      gtmId: browserIds.gtmId || null,
      clarityId: browserIds.clarityId || null,
      metaPixelId: browserIds.metaPixelId || null,
      ...(metaCapiToken ? { metaCapiToken } : {}),
      ...(metaDatasetId ? { metaDatasetId } : {}),
    },
    create: {
      id: "singleton",
      ga4Id: browserIds.ga4Id || null,
      gtmId: browserIds.gtmId || null,
      clarityId: browserIds.clarityId || null,
      metaPixelId: browserIds.metaPixelId || null,
      metaCapiToken: metaCapiToken || null,
      metaDatasetId: metaDatasetId || null,
    },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "settings.update",
    entityType: "TrackingConfig",
    entityId: "singleton",
    summary: "Tracking configuration updated",
    metadata: { capiTokenChanged: Boolean(metaCapiToken) },
  });

  return { ok: true, message: "Tracking settings saved. Tags load only after visitor consent." };
}

export async function saveMaintenanceSettings(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = maintenanceSettingsSchema.safeParse({
    ...raw,
    isBannerActive: formData.get("isBannerActive") === "on",
    isFullModeActive: formData.get("isFullModeActive") === "on",
  });
  if (!parsed.success) return toActionState(parsed.error);

  const value = {
    bannerText: parsed.data.bannerText,
    isBannerActive: parsed.data.isBannerActive,
    isFullModeActive: parsed.data.isFullModeActive,
    startAt: parsed.data.startAt || null,
    endAt: parsed.data.endAt || null,
  };

  const user = await writeSetting(
    "maintenance",
    value,
    parsed.data.isFullModeActive ? "Full maintenance mode ENABLED" : "Maintenance settings updated",
  );

  await prisma.maintenanceNotice.upsert({
    where: { id: "singleton" },
    update: {
      bannerText: value.bannerText,
      isBannerActive: value.isBannerActive,
      isFullModeActive: value.isFullModeActive,
      startAt: value.startAt ? new Date(value.startAt) : null,
      endAt: value.endAt ? new Date(value.endAt) : null,
    },
    create: {
      id: "singleton",
      bannerText: value.bannerText,
      isBannerActive: value.isBannerActive,
      isFullModeActive: value.isFullModeActive,
      startAt: value.startAt ? new Date(value.startAt) : null,
      endAt: value.endAt ? new Date(value.endAt) : null,
    },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "settings.maintenance",
    entityType: "MaintenanceNotice",
    entityId: "singleton",
    summary: value.isFullModeActive
      ? "Public site switched to maintenance mode"
      : "Maintenance mode off",
  });

  return {
    ok: true,
    message: value.isFullModeActive
      ? "Maintenance mode is ON. Staff sessions can still browse the site."
      : "Maintenance settings saved.",
  };
}

/** Toggling a method off removes it from the client payment flow at once (§43.1). */
export async function savePaymentMethodAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("settings.manage");

  const parsed = paymentMethodSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return toActionState(parsed.error);
  const { method, apiKey, apiSecret, minAmount, maxAmount, ...rest } = parsed.data;

  const existing = await prisma.paymentMethodConfig.findUnique({
    where: { method },
    select: { credentials: true },
  });

  // Gateway secrets stay server-side and are only replaced when re-entered.
  const credentials =
    apiKey || apiSecret
      ? { ...(apiKey ? { apiKey } : {}), ...(apiSecret ? { apiSecret } : {}) }
      : (existing?.credentials ?? undefined);

  await prisma.paymentMethodConfig.upsert({
    where: { method },
    update: {
      ...rest,
      accountName: rest.accountName || null,
      accountNumber: rest.accountNumber || null,
      branch: rest.branch || null,
      instructions: rest.instructions || null,
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
      ...(credentials ? { credentials: credentials as object } : {}),
    },
    create: {
      method,
      ...rest,
      accountName: rest.accountName || null,
      accountNumber: rest.accountNumber || null,
      branch: rest.branch || null,
      instructions: rest.instructions || null,
      minAmount: minAmount || null,
      maxAmount: maxAmount || null,
      ...(credentials ? { credentials: credentials as object } : {}),
    },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "settings.payment_method",
    entityType: "PaymentMethodConfig",
    entityId: method,
    summary: `${rest.label} set ${rest.isActive ? "ACTIVE" : "INACTIVE"}`,
    metadata: { credentialsChanged: Boolean(apiKey || apiSecret) },
  });

  revalidatePath("/dashboard/settings/payments");
  revalidatePath("/dashboard/my-invoices");
  return { ok: true, message: `${rest.label} saved.` };
}

export async function toggleFeatureFlagAction(key: string, enabled: boolean) {
  const user = await authorize("settings.manage");

  await prisma.featureFlag.update({ where: { key }, data: { enabled } });
  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "settings.feature_flag",
    entityType: "FeatureFlag",
    entityId: key,
    summary: `Feature flag ${key} set ${enabled ? "on" : "off"}`,
  });

  revalidatePath("/", "layout");
  revalidatePath("/dashboard/settings/features");
}

export async function toggleIntegrationAction(key: string, enabled: boolean) {
  const user = await authorize("integrations.manage");

  await prisma.integration.update({ where: { key }, data: { isEnabled: enabled } });
  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "integrations.update",
    entityType: "Integration",
    entityId: key,
    summary: `Integration ${key} set ${enabled ? "enabled" : "disabled"}`,
  });

  revalidatePath("/dashboard/integrations");
}
