"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  deleteContentAction,
  saveCaseStudyAction,
  saveFaqAction,
  saveHomepageSectionAction,
  savePostAction,
  saveTestimonialAction,
} from "@/actions/content";
import { ActionForm, ConfirmButton, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { Panel } from "@/components/dashboard/page-shell";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Markdown } from "@/components/ui/markdown";
import { useToast } from "@/components/ui/toast";

const STATUS_OPTIONS = [
  { value: "PUBLISHED", label: "Published — live on the site" },
  { value: "DRAFT", label: "Draft — not visible publicly" },
  { value: "ARCHIVED", label: "Archived" },
];

export function HomepageSectionEditor({
  sectionKey,
  enabled,
  data,
  disabled,
}: {
  sectionKey: string;
  enabled: boolean;
  data: string;
  disabled?: boolean;
}) {
  return (
    <ActionForm action={saveHomepageSectionAction} successTitle="Section published">
      <input type="hidden" name="key" value={sectionKey} />
      <SectionDataField defaultValue={data} sectionKey={sectionKey} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox name="enabled" defaultChecked={enabled} />
          Show this section on the homepage
        </label>
        <SubmitButton pendingLabel="Publishing…">{disabled ? "Save (needs database)" : "Save & publish"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function SectionDataField({ defaultValue, sectionKey }: { defaultValue: string; sectionKey: string }) {
  const [value, setValue] = React.useState(defaultValue);
  const [valid, setValid] = React.useState(true);

  return (
    <Field
      label="Section content"
      htmlFor={`data-${sectionKey}`}
      hint="Edit the text between the quotation marks. Keep the field names and punctuation as they are."
      error={useFieldError("data") ?? (valid ? undefined : "Not valid JSON — check for a missing comma or quote.")}
    >
      <Textarea
        id={`data-${sectionKey}`}
        name="data"
        rows={Math.min(22, Math.max(6, value.split("\n").length))}
        value={value}
        spellCheck={false}
        className="font-mono text-xs"
        onChange={(event) => {
          setValue(event.target.value);
          try {
            JSON.parse(event.target.value);
            setValid(true);
          } catch {
            setValid(false);
          }
        }}
      />
    </Field>
  );
}

// ---------------------------------------------------------------------------

export type PostDraft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryName: string;
  readMinutes: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
};

export function PostEditor({ draft }: { draft: PostDraft }) {
  const [content, setContent] = React.useState(draft.content);
  const [preview, setPreview] = React.useState(false);
  const router = useRouter();

  return (
    <ActionForm
      action={async (state, formData) => {
        const result = await savePostAction(state, formData);
        if (result.ok && !draft.id && result.data?.id) {
          router.push(`/dashboard/content/blog/${result.data.id}`);
        }
        return result;
      }}
      successTitle="Article saved"
    >
      {draft.id ? <input type="hidden" name="id" value={draft.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1.5fr_0.5fr]">
        <div className="space-y-5">
          <Panel title="Article">
            <div className="space-y-5">
              <PlainField name="title" label="Title" defaultValue={draft.title} required />
              <PlainField
                name="slug"
                label="URL slug"
                hint="The address of the article: /blog/your-slug."
                defaultValue={draft.slug}
                required
              />
              <AreaFieldPlain
                name="excerpt"
                label="Excerpt"
                hint="Shown on the blog index and in search results."
                rows={3}
                defaultValue={draft.excerpt}
              />

              {/* Preview before publish (PRD §47) */}
              <Field
                label="Body"
                htmlFor="content"
                hint="Markdown: ## for a heading, - for a bullet, **bold**, [text](https://link)."
                error={useFieldError("content")}
              >
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      !preview ? "border-accent bg-accent-soft text-accent" : "border-line"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(true)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      preview ? "border-accent bg-accent-soft text-accent" : "border-line"
                    }`}
                  >
                    Preview
                  </button>
                </div>
                {preview ? (
                  <div className="rounded-md border border-line bg-surface p-5">
                    <Markdown content={content || "_Nothing to preview yet._"} />
                  </div>
                ) : (
                  <Textarea
                    id="content"
                    name="content"
                    rows={20}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    required
                  />
                )}
                {preview ? <input type="hidden" name="content" value={content} /> : null}
              </Field>
            </div>
          </Panel>

          <Panel title="Search appearance">
            <div className="space-y-5">
              <PlainField name="metaTitle" label="Meta title" defaultValue={draft.metaTitle} />
              <AreaFieldPlain name="metaDescription" label="Meta description" rows={3} defaultValue={draft.metaDescription} />
            </div>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Publishing">
            <div className="space-y-5">
              <SelectFieldPlain name="status" label="Status" defaultValue={draft.status} options={STATUS_OPTIONS} />
              <PlainField name="categoryName" label="Category" defaultValue={draft.categoryName} />
              <PlainField name="readMinutes" label="Read time (minutes)" type="number" defaultValue={draft.readMinutes} />
              <SubmitButton className="w-full">Save article</SubmitButton>
            </div>
          </Panel>
        </aside>
      </div>
    </ActionForm>
  );
}

// ---------------------------------------------------------------------------

export function TestimonialForm({
  draft,
}: {
  draft?: {
    id: string;
    author: string;
    role: string;
    company: string;
    quote: string;
    rating: number;
    status: string;
  };
}) {
  return (
    <ActionForm action={saveTestimonialAction} successTitle="Testimonial saved" resetOnSuccess={!draft}>
      {draft ? <input type="hidden" name="id" value={draft.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <PlainField name="author" label="Author" defaultValue={draft?.author ?? ""} required />
        <PlainField name="role" label="Role" defaultValue={draft?.role ?? ""} required />
        <PlainField name="company" label="Company" defaultValue={draft?.company ?? ""} />
        <PlainField name="rating" label="Rating (1–5)" type="number" defaultValue={String(draft?.rating ?? 5)} />
      </div>
      <AreaFieldPlain name="quote" label="Quote" rows={4} defaultValue={draft?.quote ?? ""} />
      <SelectFieldPlain name="status" label="Status" defaultValue={draft?.status ?? "PUBLISHED"} options={STATUS_OPTIONS} />
      <SubmitButton>{draft ? "Save testimonial" : "Add testimonial"}</SubmitButton>
    </ActionForm>
  );
}

export function FaqForm({
  draft,
}: {
  draft?: { id: string; question: string; answer: string; category: string; status: string };
}) {
  return (
    <ActionForm action={saveFaqAction} successTitle="FAQ saved" resetOnSuccess={!draft}>
      {draft ? <input type="hidden" name="id" value={draft.id} /> : null}
      <PlainField name="question" label="Question" defaultValue={draft?.question ?? ""} required />
      <AreaFieldPlain name="answer" label="Answer" rows={4} defaultValue={draft?.answer ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <PlainField name="category" label="Category" defaultValue={draft?.category ?? "General"} />
        <SelectFieldPlain name="status" label="Status" defaultValue={draft?.status ?? "PUBLISHED"} options={STATUS_OPTIONS} />
      </div>
      <SubmitButton>{draft ? "Save FAQ" : "Add FAQ"}</SubmitButton>
    </ActionForm>
  );
}

export function CaseStudyForm({
  draft,
}: {
  draft?: {
    id: string;
    title: string;
    slug: string;
    client: string;
    industry: string;
    summary: string;
    challenge: string;
    solution: string;
    outcome: string;
    status: string;
    featured: boolean;
  };
}) {
  return (
    <ActionForm action={saveCaseStudyAction} successTitle="Case study saved" resetOnSuccess={!draft}>
      {draft ? <input type="hidden" name="id" value={draft.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <PlainField name="title" label="Title" defaultValue={draft?.title ?? ""} required />
        <PlainField name="slug" label="URL slug" defaultValue={draft?.slug ?? ""} required />
        <PlainField name="client" label="Client" defaultValue={draft?.client ?? ""} required />
        <PlainField name="industry" label="Industry" defaultValue={draft?.industry ?? ""} required />
      </div>
      <AreaFieldPlain name="summary" label="Summary" rows={2} defaultValue={draft?.summary ?? ""} />
      <AreaFieldPlain name="challenge" label="The challenge" rows={4} defaultValue={draft?.challenge ?? ""} />
      <AreaFieldPlain name="solution" label="What we did" rows={4} defaultValue={draft?.solution ?? ""} />
      <AreaFieldPlain name="outcome" label="The outcome" rows={4} defaultValue={draft?.outcome ?? ""} />
      <div className="flex flex-wrap items-end gap-5">
        <SelectFieldPlain
          name="status"
          label="Status"
          defaultValue={draft?.status ?? "DRAFT"}
          options={STATUS_OPTIONS}
        />
        <label className="flex items-center gap-2.5 pb-3 text-sm">
          <Checkbox name="featured" defaultChecked={draft?.featured ?? false} />
          Feature on the homepage
        </label>
      </div>
      <SubmitButton>{draft ? "Save case study" : "Add case study"}</SubmitButton>
    </ActionForm>
  );
}

export function ArchiveButton({
  entity,
  id,
}: {
  entity: "testimonial" | "faq" | "post" | "caseStudy";
  id: string;
}) {
  const { toast } = useToast();
  return (
    <ConfirmButton
      label="Archive"
      confirmLabel="Archive it?"
      onConfirm={async () => {
        await deleteContentAction(entity, id);
        toast({
          kind: "success",
          title: "Archived",
          description: "Nothing is deleted — set the status back to Published to restore it.",
        });
      }}
    />
  );
}

// --- shared field helpers ---------------------------------------------------

function PlainField({
  name,
  label,
  defaultValue,
  hint,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} required={required} error={useFieldError(name)}>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </Field>
  );
}

function AreaFieldPlain({
  name,
  label,
  defaultValue,
  hint,
  rows = 3,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <Field label={label} htmlFor={name} hint={hint} error={useFieldError(name)}>
      <Textarea id={name} name={name} rows={rows} defaultValue={defaultValue} />
    </Field>
  );
}

function SelectFieldPlain({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label} htmlFor={name} error={useFieldError(name)}>
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
