"use client";

import * as React from "react";

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
  features: string;
  processSteps: string;
  faqs: string;
  packages: string;
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
  /*
   * The draft is captured once, on first render, and never read from the props
   * again.
   *
   * These are uncontrolled inputs, so their `defaultValue` has to stay stable.
   * A Server Action re-renders this page, and on a new service the incoming
   * draft is all empty strings — React saw `defaultValue` change back to ""
   * and cleared the fields. A save that failed because the slug was taken
   * therefore threw away everything typed, which is the moment you least want
   * to retype a page of copy.
   */
  const [initial] = React.useState(draft);

  return (
    <ActionForm
      action={saveServiceAction}
      successTitle="Service saved"
      successHref="/dashboard/services"
    >
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-5">
          <Panel title="Content">
            <div className="space-y-5">
              <TitleField defaultValue={initial.title} />
              <SlugField defaultValue={initial.slug} />
              <TaglineField defaultValue={initial.tagline} />
              <ShortField defaultValue={initial.shortDescription} />
              <LongField defaultValue={initial.longDescription} />
            </div>
          </Panel>

          <Panel title="Details">
            <div className="space-y-5">
              <DeliverablesField defaultValue={initial.deliverables} />
              <TechnologiesField defaultValue={initial.technologies} />
            </div>
          </Panel>

          <Panel
            title="Page sections"
            description="Each renders as its own section on the public page. Leave one empty and that section is left out entirely."
          >
            <div className="space-y-5">
              <FeaturesField defaultValue={initial.features} />
              <ProcessStepsField defaultValue={initial.processSteps} />
              <PackagesField defaultValue={initial.packages} />
              <FaqsField defaultValue={initial.faqs} />
            </div>
          </Panel>

          <Panel title="Search appearance" description="How this page looks in Google results.">
            <div className="space-y-5">
              <MetaTitleField defaultValue={initial.metaTitle} />
              <MetaDescriptionField defaultValue={initial.metaDescription} />
            </div>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Publishing">
            <div className="space-y-5">
              <StatusField defaultValue={initial.status} />
              <CategoryField defaultValue={initial.categorySlug} categories={categories} />
              <IconField defaultValue={initial.icon} />
              <FeaturedField defaultChecked={initial.featured} />
            </div>
            <SubmitButton className="mt-5 w-full">Save service</SubmitButton>
          </Panel>

          <Panel title="Pricing">
            <div className="space-y-5">
              <PricingModelField defaultValue={initial.pricingModel} />
              <StartingPriceField defaultValue={initial.startingPrice} />
              <CurrencyField defaultValue={initial.currency} />
              <TimelineField defaultValue={initial.timeline} />
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
      label="Slug"
      htmlFor="slug"
      required
      hint="The web address: /services/your-slug. Must be unique."
      error={useFieldError("slug")}
    >
      <Input id="slug" name="slug" defaultValue={defaultValue} required />
    </Field>
  );
}

function TaglineField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Tagline" htmlFor="tagline" error={useFieldError("tagline")}>
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
      hint="Used on service cards and in search results."
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

function FeaturesField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="What makes this work"
      htmlFor="features"
      hint={'One per line, as "Title | Detail". Example: Performance budget enforced | Checked in CI, not measured after launch.'}
      error={useFieldError("features")}
    >
      <Textarea id="features" name="features" rows={6} defaultValue={defaultValue} />
    </Field>
  );
}

function ProcessStepsField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="How we deliver it"
      htmlFor="processSteps"
      hint={'One step per line, as "Title | Detail", in the order they happen. They are numbered for you.'}
      error={useFieldError("processSteps")}
    >
      <Textarea id="processSteps" name="processSteps" rows={6} defaultValue={defaultValue} />
    </Field>
  );
}

function PackagesField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Packages"
      htmlFor="packages"
      hint={
        'One per line: Name | Price | Billing | Summary | Feature; Feature. Leave the price empty for "Custom quote", and put * before a name to highlight that card.'
      }
      error={useFieldError("packages")}
    >
      <Textarea
        id="packages"
        name="packages"
        rows={5}
        defaultValue={defaultValue}
        placeholder={"Launch | 1500 | one-time | A focused build | Up to 8 pages; CMS; 30 days support"}
      />
    </Field>
  );
}

function FaqsField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Common questions"
      htmlFor="faqs"
      hint={'One per line, as "Question | Answer". A line without an answer is skipped.'}
      error={useFieldError("faqs")}
    >
      <Textarea id="faqs" name="faqs" rows={6} defaultValue={defaultValue} />
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
    <Field label="Meta title" htmlFor="metaTitle" hint="Up to 70 characters." error={useFieldError("metaTitle")}>
      <Input id="metaTitle" name="metaTitle" defaultValue={defaultValue} />
    </Field>
  );
}

function MetaDescriptionField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Meta description"
      htmlFor="metaDescription"
      hint="Up to 160 characters."
      error={useFieldError("metaDescription")}
    >
      <Textarea id="metaDescription" name="metaDescription" rows={3} defaultValue={defaultValue} />
    </Field>
  );
}

function StatusField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Status" htmlFor="status" error={useFieldError("status")}>
      <Select id="status" name="status" defaultValue={defaultValue}>
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </Select>
    </Field>
  );
}

function CategoryField({
  defaultValue,
  categories,
}: {
  defaultValue: string;
  categories: { slug: string; name: string }[];
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

function IconField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Icon" htmlFor="icon" hint="A lucide icon name, e.g. Code2 or Bot." error={useFieldError("icon")}>
      <Input id="icon" name="icon" defaultValue={defaultValue} />
    </Field>
  );
}

function FeaturedField({ defaultChecked }: { defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-step--1">
      <Checkbox name="featured" defaultChecked={defaultChecked} />
      Feature on the homepage
    </label>
  );
}

function PricingModelField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Pricing model" htmlFor="pricingModel" error={useFieldError("pricingModel")}>
      <Select id="pricingModel" name="pricingModel" defaultValue={defaultValue}>
        {PRICING.map((value) => (
          <option key={value} value={value}>
            {value.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function StartingPriceField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field
      label="Starting price"
      htmlFor="startingPrice"
      hint="Also the figure the estimate range scales from. Leave empty to hide both."
      error={useFieldError("startingPrice")}
    >
      <Input id="startingPrice" name="startingPrice" type="number" min={0} step="0.01" defaultValue={defaultValue} />
    </Field>
  );
}

function CurrencyField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Currency" htmlFor="currency" error={useFieldError("currency")}>
      <Select id="currency" name="currency" defaultValue={defaultValue}>
        {["USD", "BDT", "EUR", "GBP"].map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function TimelineField({ defaultValue }: { defaultValue: string }) {
  return (
    <Field label="Timeline" htmlFor="timeline" error={useFieldError("timeline")}>
      <Input id="timeline" name="timeline" defaultValue={defaultValue} />
    </Field>
  );
}