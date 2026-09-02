"use client";

import * as React from "react";

import {
  saveBrandSettings,
  saveContactSettings,
  saveMaintenanceSettings,
  savePaymentMethodAction,
  saveSeoSettings,
  saveThemeSettings,
  saveTrackingSettings,
  toggleFeatureFlagAction,
  toggleIntegrationAction,
} from "@/actions/settings";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** A single on/off control reused by feature flags and integrations. */
function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

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
      <TextField
        name="logoUrl"
        label="Logo URL"
        hint="A path in /public or a full URL. The bundled mark is /brand/logo-icon.svg."
        defaultValue={values.logoUrl}
      />
      <TextField name="faviconUrl" label="Favicon URL" defaultValue={values.faviconUrl} />
      <SubmitButton>Save brand</SubmitButton>
    </ActionForm>
  );
}

export function ThemeForm({ accent, mode }: { accent: string; mode: string }) {
  return (
    <ActionForm action={saveThemeSettings} successTitle="Theme saved">
      <SelectField
        name="accent"
        label="Accent identity"
        hint="Applied site-wide. Visitors cannot enter arbitrary colours."
        defaultValue={accent}
        options={[
          { value: "purple", label: "Purple — premium violet/indigo" },
          { value: "cyan", label: "Cyan — modern cyan/blue" },
        ]}
      />
      <SelectField
        name="mode"
        label="Default appearance"
        hint="Visitors can still switch this for themselves."
        defaultValue={mode}
        options={[
          { value: "system", label: "Follow the device setting" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
      <SubmitButton>Save theme</SubmitButton>
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
      <TextField name="ogImage" label="Social share image" defaultValue={values.ogImage} />
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

      <div className="rounded-lg border border-border bg-surface-2/60 p-4">
        <p className="text-sm font-semibold">Meta Conversions API (server-side)</p>
        <p className="mt-1 text-xs text-muted-foreground">
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

      <p className="text-xs text-muted-foreground">
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
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-semibold">Stage 1 — advance notice</p>
        <p className="mt-1 text-xs text-muted-foreground">
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
          fullMode ? "border-danger/45 bg-danger/8" : "border-border",
        )}
      >
        <p className="text-sm font-semibold">Stage 2 — full maintenance mode</p>
        <p className="mt-1 text-xs text-muted-foreground">
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
