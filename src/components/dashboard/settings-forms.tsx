"use client";

import * as React from "react";

import { Plus, Trash2 } from "lucide-react";

import {
  saveAssistantSettings,
  saveBrandSettings,
  saveContactSettings,
  saveMaintenanceSettings,
  savePaymentMethodAction,
  saveSeoSettings,
  saveSponsorsSettings,
  saveFontSettings,
  saveLocalizationSettings,
  saveThemeSettings,
  saveTrackingSettings,
  saveWhatsappSettings,
  toggleFeatureFlagAction,
  toggleIntegrationAction,
} from "@/actions/settings";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Checkbox, Field, Input, Select, Switch, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FONT_IDS, FONT_META, type FontId, type FontPolicy } from "@/lib/fonts";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { IMAGE_GUIDANCE } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import { THEMES, THEME_META, type ThemeId, type ThemePolicy } from "@/lib/theme";
import type { SponsorItem, SponsorsContent } from "@/components/marketing/sponsors";

const Toggle = Switch;

export function FeatureFlagToggle({
  flagKey,
  enabled,
  description,
}: {
  flagKey: string;
  enabled: boolean;
  description: string;
}) {
  const [checked, setChecked] = React.useState(enabled);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  return (
    <Toggle
      label={description}
      checked={checked}
      disabled={pending}
      onChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          try {
            await toggleFeatureFlagAction(flagKey, next);
            toast({ kind: "success", title: next ? "Feature enabled" : "Feature disabled" });
          } catch {
            setChecked(!next);
            toast({ kind: "error", title: "Could not change that flag" });
          }
        });
      }}
    />
  );
}

export function IntegrationToggle({
  integrationKey,
  enabled,
}: {
  integrationKey: string;
  enabled: boolean;
}) {
  const [checked, setChecked] = React.useState(enabled);
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  return (
    <Toggle
      label={`Enable ${integrationKey}`}
      checked={checked}
      disabled={pending}
      onChange={(next) => {
        setChecked(next);
        startTransition(async () => {
          try {
            await toggleIntegrationAction(integrationKey, next);
            toast({ kind: "success", title: next ? "Integration enabled" : "Integration disabled" });
          } catch {
            setChecked(!next);
            toast({ kind: "error", title: "Could not change that integration" });
          }
        });
      }}
    />
  );
}

// ---------------------------------------------------------------------------

export function BrandForm({ values }: { values: Record<string, string> }) {
  const [logoUrl, setLogoUrl] = React.useState(values.logoUrl ?? "");
  const [faviconUrl, setFaviconUrl] = React.useState(values.faviconUrl ?? "");

  return (
    <ActionForm action={saveBrandSettings} successTitle="Brand saved">
      <TextField name="siteName" label="Site name" defaultValue={values.siteName} required />
      <TextField name="tagline" label="Tagline" defaultValue={values.tagline} />
      <AreaField
        name="description"
        label="Description"
        hint="Used in the footer and as the default meta description fallback."
        defaultValue={values.description}
      />
      <input type="hidden" name="logoUrl" value={logoUrl} />
      <ImageUpload
        label="Logo"
        value={logoUrl}
        onChange={setLogoUrl}
        guidance={IMAGE_GUIDANCE.logo}
        folder="hyascka/brand"
      />
      <input type="hidden" name="faviconUrl" value={faviconUrl} />
      <ImageUpload
        label="Favicon"
        value={faviconUrl}
        onChange={setFaviconUrl}
        guidance="512 × 512 px, transparent"
        folder="hyascka/brand"
      />
      <SubmitButton>Save brand</SubmitButton>
    </ActionForm>
  );
}

export function ThemeSettingsForm({ policy }: { policy: ThemePolicy }) {
  const [enabled, setEnabled] = React.useState<ThemeId[]>(policy.enabledThemes);
  const [defaultTheme, setDefaultTheme] = React.useState<ThemeId>(policy.defaultTheme);
  const [allowToggle, setAllowToggle] = React.useState(policy.allowUserToggle);

  const toggleTheme = (id: ThemeId) => {
    setEnabled((current) => {
      const next = current.includes(id) ? current.filter((t) => t !== id) : [...current, id];
      // Never allow an empty set — the site would have nothing to render.
      if (!next.length) return current;
      if (!next.includes(defaultTheme)) setDefaultTheme(next[0]);
      return next;
    });
  };

  return (
    <ActionForm action={saveThemeSettings} successTitle="Theme saved">
      {enabled.map((id) => (
        <input key={id} type="hidden" name="enabledThemes" value={id} />
      ))}
      <input type="hidden" name="defaultTheme" value={defaultTheme} />

      <div>
        <p className="text-step--1 font-medium text-ink">Available themes</p>
        <p className="mt-1 text-step--2 text-ink-muted">
          Tick the themes visitors may switch between. The one marked default is what a
          first-time visitor sees.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {THEMES.map((id) => {
            const meta = THEME_META[id];
            const isOn = enabled.includes(id);
            const isDefault = defaultTheme === id;
            return (
              <div
                key={id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  isOn ? "border-accent-border bg-accent-soft/40" : "border-line bg-surface-2",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="h-8 w-8 shrink-0 rounded-md border border-line-strong"
                    style={{ background: meta.swatch }}
                    aria-hidden
                  />
                  <Switch
                    checked={isOn}
                    onChange={() => toggleTheme(id)}
                    label={`Enable ${meta.label}`}
                    disabled={isOn && enabled.length === 1}
                  />
                </div>
                <p className="mt-3 text-step--1 font-semibold text-ink">{meta.label}</p>
                <p className="mt-0.5 text-step--2 leading-snug text-ink-muted">{meta.description}</p>

                <button
                  type="button"
                  disabled={!isOn}
                  onClick={() => setDefaultTheme(id)}
                  className={cn(
                    "mt-3 w-full rounded-btn border px-2.5 py-1.5 text-step--2 font-semibold transition-colors",
                    isDefault
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line-strong text-ink-soft hover:bg-surface-3 disabled:opacity-40",
                  )}
                >
                  {isDefault ? "Default theme" : "Make default"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-line p-4">
        <div>
          <p className="text-step--1 font-medium text-ink">Let visitors switch theme</p>
          <p className="mt-1 text-step--2 text-ink-muted">
            When this is off the navbar toggle disappears and every visitor sees the default
            theme. It also hides automatically if only one theme is enabled.
          </p>
        </div>
        <input type="hidden" name="allowUserToggle" value={allowToggle ? "on" : ""} />
        <Switch
          checked={allowToggle && enabled.length > 1}
          onChange={setAllowToggle}
          label="Allow visitors to switch theme"
          disabled={enabled.length < 2}
        />
      </div>

      <SubmitButton>Save theme policy</SubmitButton>
    </ActionForm>
  );
}

/** Sponsor / partner marquee editor — image or text, direction and speed. */
export function SponsorsForm({ content }: { content: SponsorsContent }) {
  const [items, setItems] = React.useState<SponsorItem[]>(content.items);

  const update = (index: number, patch: Partial<SponsorItem>) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <ActionForm action={saveSponsorsSettings} successTitle="Sponsors saved">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="title" label="Strip heading" defaultValue={content.title} required />
        <SelectField
          name="direction"
          label="Scroll direction"
          defaultValue={content.direction}
          options={[
            { value: "left", label: "Right to left" },
            { value: "right", label: "Left to right" },
          ]}
        />
        <TextField
          name="speed"
          label="Loop duration (seconds)"
          type="number"
          hint="Lower is faster. 38 is a comfortable default."
          defaultValue={String(content.speed)}
        />
        <label className="flex items-end gap-2.5 pb-3 text-step--1">
          <Checkbox name="enabled" defaultChecked={content.enabled} />
          Show the strip on the homepage
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-step--1 font-medium text-ink">Sponsors ({items.length})</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((current) => [
                ...current,
                { id: `s${Date.now().toString(36)}`, label: "", imageUrl: "", href: "" },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add sponsor
          </Button>
        </div>
        <p className="mt-1 text-step--2 text-ink-muted">
          Upload a logo from your computer, or leave it empty to show the name as text.
          Logos display at 32px tall — a transparent PNG or SVG around 320×80 works best.
        </p>

        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Field label="Name" htmlFor={`sp-label-${item.id}`}>
                <Input
                  id={`sp-label-${item.id}`}
                  value={item.label}
                  onChange={(event) => update(index, { label: event.target.value })}
                  placeholder="Northlane Systems"
                />
              </Field>
              <ImageUpload
                label="Logo"
                value={item.imageUrl ?? ""}
                onChange={(url) => update(index, { imageUrl: url })}
                guidance={IMAGE_GUIDANCE.sponsorLogo}
                folder="hyascka/sponsors"
              />
              <Field label="Link" htmlFor={`sp-href-${item.id}`}>
                <Input
                  id={`sp-href-${item.id}`}
                  value={item.href ?? ""}
                  onChange={(event) => update(index, { href: event.target.value })}
                  placeholder="Optional"
                />
              </Field>
              <div className="flex items-end pb-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.label || "sponsor"}`}
                  onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubmitButton>Save sponsor strip</SubmitButton>
    </ActionForm>
  );
}

export function WhatsappForm({ values }: { values: Record<string, string> }) {
  return (
    <ActionForm action={saveWhatsappSettings} successTitle="WhatsApp saved">
      <TextField
        name="phone"
        label="WhatsApp number"
        hint="With the country code, e.g. +8801571083401. Leave empty to hide the button."
        defaultValue={values.phone ?? ""}
      />
      <TextField name="label" label="Button label" defaultValue={values.label} required />
      <AreaField
        name="greeting"
        label="Pre-filled message"
        hint="What the visitor's WhatsApp conversation opens with."
        defaultValue={values.greeting}
      />
      <SubmitButton>Save WhatsApp settings</SubmitButton>
    </ActionForm>
  );
}

export function AssistantForm({ values }: { values: Record<string, string> }) {
  return (
    <ActionForm action={saveAssistantSettings} successTitle="Assistant saved">
      <TextField name="name" label="Assistant name" defaultValue={values.name} required />
      <AreaField
        name="greeting"
        label="Opening message"
        hint="The first thing a visitor sees when they open the chat."
        defaultValue={values.greeting}
      />
      <AreaField
        name="suggestions"
        label="Suggested questions"
        hint="One per line, up to six. Shown as tappable chips before the first message."
        defaultValue={values.suggestions}
      />
      <SubmitButton>Save assistant settings</SubmitButton>
    </ActionForm>
  );
}

export function ContactForm({ values }: { values: Record<string, string> }) {
  return (
    <ActionForm action={saveContactSettings} successTitle="Contact details saved">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="email" label="General email" type="email" defaultValue={values.email} required />
        <TextField name="supportEmail" label="Support email" type="email" defaultValue={values.supportEmail} required />
        <TextField name="phone" label="Phone" defaultValue={values.phone} />
        <TextField name="whatsapp" label="WhatsApp number" hint="Digits only, with country code." defaultValue={values.whatsapp} />
        <TextField name="addressLine" label="Address" defaultValue={values.addressLine} />
        <TextField name="city" label="City" defaultValue={values.city} />
        <TextField name="country" label="Country" defaultValue={values.country} />
        <TextField name="hours" label="Working hours" defaultValue={values.hours} />
      </div>
      <TextField name="responseTime" label="Response-time promise" defaultValue={values.responseTime} />
      <SubmitButton>Save contact details</SubmitButton>
    </ActionForm>
  );
}

export function SeoForm({ values }: { values: Record<string, string> }) {
  const [ogImage, setOgImage] = React.useState(values.ogImage ?? "");

  return (
    <ActionForm action={saveSeoSettings} successTitle="SEO defaults saved">
      <TextField name="defaultTitle" label="Default title" defaultValue={values.defaultTitle} required />
      <TextField
        name="titleTemplate"
        label="Title template"
        hint="%s is replaced by the page title, e.g. “%s · HYASCKA”."
        defaultValue={values.titleTemplate}
      />
      <AreaField
        name="defaultDescription"
        label="Default meta description"
        hint="Between 50 and 200 characters."
        defaultValue={values.defaultDescription}
      />
      <input type="hidden" name="ogImage" value={ogImage} />
      <ImageUpload
        label="Social share image"
        value={ogImage}
        onChange={setOgImage}
        guidance={IMAGE_GUIDANCE.ogImage}
        folder="hyascka/seo"
      />
      <TextField name="twitterHandle" label="X / Twitter handle" defaultValue={values.twitterHandle} />
      <SelectField
        name="robots"
        label="Search engine indexing"
        hint="Set to noindex only while the site is not ready to be found."
        defaultValue={values.robots}
        options={[
          { value: "index, follow", label: "Index and follow (normal)" },
          { value: "noindex, nofollow", label: "Block all indexing" },
          { value: "index, nofollow", label: "Index, do not follow links" },
          { value: "noindex, follow", label: "Do not index, follow links" },
        ]}
      />
      <SubmitButton>Save SEO defaults</SubmitButton>
    </ActionForm>
  );
}

export function TrackingForm({ values, hasCapiToken }: { values: Record<string, string>; hasCapiToken: boolean }) {
  return (
    <ActionForm action={saveTrackingSettings} successTitle="Tracking saved">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="ga4Id" label="GA4 measurement ID" hint="Looks like G-XXXXXXXXXX." defaultValue={values.ga4Id} />
        <TextField name="gtmId" label="Google Tag Manager ID" hint="Looks like GTM-XXXXXX." defaultValue={values.gtmId} />
        <TextField name="clarityId" label="Microsoft Clarity project ID" defaultValue={values.clarityId} />
        <TextField name="metaPixelId" label="Meta Pixel ID" hint="Numeric." defaultValue={values.metaPixelId} />
      </div>

      <div className="rounded-lg border border-line bg-surface-2/60 p-4">
        <p className="text-sm font-semibold">Meta Conversions API (server-side)</p>
        <p className="mt-1 text-xs text-ink-muted">
          Sent from the server so conversions survive ad blockers and tracking prevention. The token
          is stored server-side and never rendered into the page.
          {hasCapiToken ? " A token is currently stored — leave blank to keep it." : ""}
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextField
            name="metaCapiToken"
            label="Access token"
            type="password"
            placeholder={hasCapiToken ? "•••••••• (stored)" : "Paste token"}
            defaultValue=""
          />
          <TextField name="metaDatasetId" label="Dataset ID" defaultValue={values.metaDatasetId ?? ""} />
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        All browser tags load only after a visitor accepts cookies. Declining is fully supported and
        does not restrict any part of the site.
      </p>
      <SubmitButton>Save tracking</SubmitButton>
    </ActionForm>
  );
}

export function MaintenanceForm({ values }: { values: Record<string, unknown> }) {
  const [fullMode, setFullMode] = React.useState(Boolean(values.isFullModeActive));

  return (
    <ActionForm action={saveMaintenanceSettings} successTitle="Maintenance settings saved">
      <div className="rounded-lg border border-line p-4">
        <p className="text-sm font-semibold">Stage 1 — advance notice</p>
        <p className="mt-1 text-xs text-ink-muted">
          A dismissible banner across the site. Visitors keep full access.
        </p>
        <div className="mt-4 space-y-4">
          <AreaField
            name="bannerText"
            label="Banner message"
            defaultValue={String(values.bannerText ?? "")}
            placeholder="Site will be briefly unavailable at 12:00 AM on 30 Aug for scheduled maintenance."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="startAt"
              label="Planned start"
              type="datetime-local"
              defaultValue={String(values.startAt ?? "").slice(0, 16)}
            />
            <TextField
              name="endAt"
              label="Expected back"
              type="datetime-local"
              hint="Drives the countdown on the maintenance page."
              defaultValue={String(values.endAt ?? "").slice(0, 16)}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox name="isBannerActive" defaultChecked={Boolean(values.isBannerActive)} />
            Show the notice banner now
          </label>
        </div>
      </div>

      <div
        className={cn(
          "rounded-lg border p-4 transition-colors",
          fullMode ? "border-danger/45 bg-danger/8" : "border-line",
        )}
      >
        <p className="text-sm font-semibold">Stage 2 — full maintenance mode</p>
        <p className="mt-1 text-xs text-ink-muted">
          Replaces the public site with the branded maintenance page. Staff sessions bypass it and
          keep working normally.
        </p>
        <label className="mt-4 flex items-center gap-2.5 text-sm">
          <Checkbox
            name="isFullModeActive"
            checked={fullMode}
            onChange={(event) => setFullMode(event.target.checked)}
          />
          <span className={fullMode ? "font-semibold text-danger" : ""}>
            Take the public site offline now
          </span>
        </label>
      </div>

      <SubmitButton variant={fullMode ? "danger" : "primary"}>Save maintenance settings</SubmitButton>
    </ActionForm>
  );
}

export function PaymentMethodForm({
  method,
  values,
  isGateway,
}: {
  method: string;
  values: Record<string, string | boolean | number | null>;
  isGateway: boolean;
}) {
  return (
    <ActionForm action={savePaymentMethodAction} successTitle="Payment method saved">
      <input type="hidden" name="method" value={method} />
      <TextField name="label" label="Display name" defaultValue={String(values.label ?? "")} required />

      <label className="flex items-center gap-2.5 text-sm">
        <Checkbox name="isActive" defaultChecked={Boolean(values.isActive)} />
        Active — shown to clients on the payment screen
      </label>

      {isGateway ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="apiKey"
            label="Store ID / API key"
            type="password"
            placeholder={values.hasCredentials ? "•••••••• (stored)" : ""}
            hint="Stored server-side. Leave blank to keep the existing value."
            defaultValue=""
          />
          <TextField
            name="apiSecret"
            label="Store password / API secret"
            type="password"
            placeholder={values.hasCredentials ? "•••••••• (stored)" : ""}
            defaultValue=""
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="accountName" label="Account name" defaultValue={String(values.accountName ?? "")} />
          <TextField name="accountNumber" label="Number / account" defaultValue={String(values.accountNumber ?? "")} />
          <TextField name="branch" label="Branch / routing" defaultValue={String(values.branch ?? "")} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="minAmount" label="Minimum amount" type="number" defaultValue={String(values.minAmount ?? "")} />
        <TextField name="maxAmount" label="Maximum amount" type="number" defaultValue={String(values.maxAmount ?? "")} />
      </div>

      <AreaField
        name="instructions"
        label="Instructions shown to the client"
        hint="Explain exactly what to send and which reference to submit."
        defaultValue={String(values.instructions ?? "")}
      />

      <SubmitButton>Save method</SubmitButton>
    </ActionForm>
  );
}

// --- Small field helpers, each reading its own server-side error ------------

function TextField({
  name,
  label,
  defaultValue,
  hint,
  type = "text",
  required,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} required={required} error={useFieldError(name)}>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
    </Field>
  );
}

function AreaField({
  name,
  label,
  defaultValue,
  hint,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={useFieldError(name)}>
      <Textarea id={name} name={name} rows={3} defaultValue={defaultValue} placeholder={placeholder} />
    </Field>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  hint,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={useFieldError(name)}>
      <Select id={name} name={name} defaultValue={defaultValue}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/**
 * Typeface picker (PRD v5.1 §2).
 *
 * Each option renders its own name in its own font, so the choice is made by
 * looking rather than by guessing what "Manrope" means. The families are all
 * loaded by the root layout, so the preview is the real thing.
 */
export function FontSettingsForm({ policy }: { policy: FontPolicy }) {
  const [heading, setHeading] = React.useState<FontId>(policy.headingFont);
  const [bodyFont, setBodyFont] = React.useState<FontId>(policy.bodyFont);

  const group = (
    label: string,
    hint: string,
    value: FontId,
    onChange: (id: FontId) => void,
    name: string,
  ) => (
    <div>
      <p className="text-step--1 font-medium text-ink">{label}</p>
      <p className="mt-1 text-step--2 text-ink-muted">{hint}</p>
      <input type="hidden" name={name} value={value} />
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {FONT_IDS.map((id) => {
          const meta = FONT_META[id];
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-pressed={active}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                active
                  ? "border-accent-border bg-accent-soft"
                  : "border-line hover:border-line-strong hover:bg-surface-2",
              )}
            >
              <span
                className="block text-step-1 font-semibold text-ink"
                style={{ fontFamily: `var(--font-${id === "geist" ? "geist-sans" : id})` }}
              >
                {meta.label}
              </span>
              <span className="mt-1 block text-step--2 text-ink-muted">{meta.description}</span>
              <span
                className="mt-2.5 block text-step--1 text-ink-soft"
                style={{ fontFamily: `var(--font-${id === "geist" ? "geist-sans" : id})` }}
              >
                {meta.sample}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <ActionForm action={saveFontSettings} successTitle="Typography saved">
      {group(
        "Heading font",
        "Used for every headline, section title and card heading.",
        heading,
        setHeading,
        "headingFont",
      )}
      {group(
        "Body font",
        "Used for paragraphs, labels and everything you actually read.",
        bodyFont,
        setBodyFont,
        "bodyFont",
      )}
      <SubmitButton>Save typography</SubmitButton>
    </ActionForm>
  );
}

/**
 * Currency and locale (PRD v5.1 §8).
 *
 * Changing the currency changes how prices are *displayed*; it does not convert
 * the numbers, which is said plainly on the form so nobody expects an exchange
 * rate that is not there.
 */
export function LocalizationForm({ values }: { values: Record<string, string> }) {
  return (
    <ActionForm action={saveLocalizationSettings} successTitle="Localization saved">
      <SelectField
        name="currency"
        label="Currency"
        hint="Applies to service prices, quotes and new invoices. Existing invoices keep the currency they were issued in."
        defaultValue={values.currency}
        options={[
          { value: "USD", label: "US dollar ($)" },
          { value: "EUR", label: "Euro (€)" },
          { value: "GBP", label: "Pound sterling (£)" },
          { value: "BDT", label: "Bangladeshi taka (৳)" },
        ]}
      />
      <div className="rounded-lg border border-warning/40 bg-warning-soft p-3 text-step--2 text-warning">
        This changes the currency prices are shown in — it does not convert the amounts. Update your
        service prices to match after switching.
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="locale" label="Locale" hint="Language tag, e.g. en or en-GB." defaultValue={values.locale} />
        <TextField
          name="timezone"
          label="Time zone"
          hint="Used for dates in the dashboard and on invoices."
          defaultValue={values.timezone}
        />
      </div>
      <SubmitButton>Save localization</SubmitButton>
    </ActionForm>
  );
}
