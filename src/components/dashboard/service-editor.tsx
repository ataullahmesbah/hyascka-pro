"use client";

import { saveServiceAction } from "@/actions/content";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Panel } from "@/components/dashboard/page-shell";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";

export type ServiceDraft = {
  id?: string;
  title: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  categorySlug: string;
  icon: string;
  timeline: string;
  pricingModel: string;
  startingPrice: string;
  currency: string;
  status: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  deliverables: string;
  technologies: string;
};

const PRICING = ["FIXED", "STARTING_FROM", "CUSTOM_QUOTE", "MONTHLY_RETAINER", "HIDDEN"];

/**
 * Structured, form-based editor — no raw HTML field anywhere, per the CMS
 * safety rule (PRD §47).
 */
export function ServiceEditor({
  draft,
  categories,
}: {
  draft: ServiceDraft;
  categories: { slug: string; name: string }[];
}) {
  return (
    <ActionForm action={saveServiceAction} successTitle="Service saved">
      {draft.id ? <input type="hidden" name="id" value={draft.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-5">
          <Panel title="Content">
            <div className="space-y-5">
              <TitleField defaultValue={draft.title} />
              <SlugField defaultValue={draft.slug} />
              <TaglineField defaultValue={draft.tagline} />
              <ShortField defaultValue={draft.shortDescription} />
              <LongField defaultValue={draft.longDescription} />
            </div>
          </Panel>

          <Panel title="Details">
            <div className="space-y-5">
              <DeliverablesField defaultValue={draft.deliverables} />
              <TechnologiesField defaultValue={draft.technologies} />
            </div>
          </Panel>

          <Panel title="Search appearance" description="How this page looks in Google results.">
            <div className="space-y-5">
              <MetaTitleField defaultValue={draft.metaTitle} />
              <MetaDescriptionField defaultValue={draft.metaDescription} />
            </div>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Publishing">
            <div className="space-y-5">
              <StatusField defaultValue={draft.status} />
              <div className="flex items-center gap-2.5">
                <Checkbox id="featured" name="featured" defaultChecked={draft.featured} />
                <label htmlFor="featured" className="text-sm">
                  Feature on the homepage
                </label>
              </div>
              <SubmitButton className="w-full">Save service</SubmitButton>
            </div>
          </Panel>

          <Panel title="Commercial">
            <div className="space-y-5">
              <CategoryField categories={categories} defaultValue={draft.categorySlug} />
              <PricingField defaultValue={draft.pricingModel} />
              <PriceField defaultValue={draft.startingPrice} />
              <CurrencyField defaultValue={draft.currency} />
              <TimelineField defaultValue={draft.timeline} />
              <IconField defaultValue={draft.icon} />
            </div>
          </Panel>
        </aside>
      </div>
    </ActionForm>
  );
}

function TitleField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Title" htmlFor="title" required error={useFieldError("title")}>
      <Input id="title" name="title" defaultValue={defaultValue} required />
    </Field>
  );
}

function SlugField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="URL slug"
      htmlFor="slug"
      required
      hint="The address of the page: /services/your-slug. Lowercase letters, numbers and dashes only."
      error={useFieldError("slug")}
    >
      <Input id="slug" name="slug" defaultValue={defaultValue} required />
    </Field>
  );
}

function TaglineField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Tagline" htmlFor="tagline" hint="One line, shown under the page title." error={useFieldError("tagline")}>
      <Input id="tagline" name="tagline" defaultValue={defaultValue} />
    </Field>
  );
}

function ShortField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Short description"
      htmlFor="shortDescription"
      required
      hint="Shown on the services grid. Two sentences works well."
      error={useFieldError("shortDescription")}
    >
      <Textarea id="shortDescription" name="shortDescription" rows={3} defaultValue={defaultValue} required />
    </Field>
  );
}

function LongField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Full description"
      htmlFor="longDescription"
      required
      hint="Leave a blank line between paragraphs."
      error={useFieldError("longDescription")}
    >
      <Textarea id="longDescription" name="longDescription" rows={10} defaultValue={defaultValue} required />
    </Field>
  );
}

function DeliverablesField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Deliverables"
      htmlFor="deliverables"
      hint="One per line. These appear as the “What you receive” list."
      error={useFieldError("deliverables")}
    >
      <Textarea id="deliverables" name="deliverables" rows={7} defaultValue={defaultValue} />
    </Field>
  );
}

function TechnologiesField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Tools and technologies" htmlFor="technologies" hint="One per line." error={useFieldError("technologies")}>
      <Textarea id="technologies" name="technologies" rows={5} defaultValue={defaultValue} />
    </Field>
  );
}

function MetaTitleField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Meta title"
      htmlFor="metaTitle"
      hint="Up to about 60 characters. Google truncates longer titles."
      error={useFieldError("metaTitle")}
    >
      <Input id="metaTitle" name="metaTitle" defaultValue={defaultValue} maxLength={70} />
    </Field>
  );
}

function MetaDescriptionField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Meta description"
      htmlFor="metaDescription"
      hint="Around 155 characters. This is the grey text under the blue link."
      error={useFieldError("metaDescription")}
    >
      <Textarea id="metaDescription" name="metaDescription" rows={3} defaultValue={defaultValue} maxLength={200} />
    </Field>
  );
}

function StatusField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Status" htmlFor="status" error={useFieldError("status")}>
      <Select id="status" name="status" defaultValue={defaultValue}>
        <option value="PUBLISHED">Published — live on the site</option>
        <option value="DRAFT">Draft — not visible publicly</option>
        <option value="ARCHIVED">Archived</option>
      </Select>
    </Field>
  );
}

function CategoryField({
  categories,
  defaultValue,
}: {
  categories: { slug: string; name: string }[];
  defaultValue: string;
}) {
  return (
    <Field label="Category" htmlFor="categorySlug" error={useFieldError("categorySlug")}>
      <Select id="categorySlug" name="categorySlug" defaultValue={defaultValue}>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function PricingField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Pricing model" htmlFor="pricingModel" error={useFieldError("pricingModel")}>
      <Select id="pricingModel" name="pricingModel" defaultValue={defaultValue}>
        {PRICING.map((model) => (
          <option key={model} value={model}>
            {model.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function PriceField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Starting price" htmlFor="startingPrice" hint="Leave empty for custom quote." error={useFieldError("startingPrice")}>
      <Input id="startingPrice" name="startingPrice" type="number" min={0} step={1000} defaultValue={defaultValue} />
    </Field>
  );
}

function CurrencyField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Currency" htmlFor="currency" error={useFieldError("currency")}>
      <Select id="currency" name="currency" defaultValue={defaultValue}>
        {["BDT", "USD", "EUR", "GBP"].map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function TimelineField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Typical timeline" htmlFor="timeline" error={useFieldError("timeline")}>
      <Input id="timeline" name="timeline" defaultValue={defaultValue} placeholder="4–10 weeks" />
    </Field>
  );
}

function IconField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Icon"
      htmlFor="icon"
      hint="A Lucide icon name, e.g. Code2, Search, Bot."
      error={useFieldError("icon")}
    >
      <Input id="icon" name="icon" defaultValue={defaultValue} placeholder="Sparkles" />
    </Field>
  );
}
