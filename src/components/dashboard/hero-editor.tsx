"use client";

import * as React from "react";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";

import { saveHeroAction } from "@/actions/content";
import { ActionForm, SubmitButton, useFieldError } from "@/components/dashboard/action-form";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { IMAGE_GUIDANCE } from "@/lib/upload-limits";
import type { HeroContent, HeroSlide } from "@/components/marketing/hero";

const BLANK: Omit<HeroSlide, "id"> = {
  eyebrow: "",
  headline: "",
  highlight: "",
  subheadline: "",
  primaryCta: { label: "Start a project", href: "/contact" },
  secondaryCta: { label: "See our work", href: "/work" },
  imageUrl: "",
};

/**
 * Structured hero editor (PRD §4, §6 non-developer rules). Every field is a
 * labelled input; the JSON that reaches the server is assembled here rather
 * than typed by an editor.
 */
export function HeroEditor({ content }: { content: HeroContent }) {
  const [slides, setSlides] = React.useState<HeroSlide[]>(content.slides);
  const [openId, setOpenId] = React.useState<string | null>(content.slides[0]?.id ?? null);

  const update = (id: string, patch: Partial<HeroSlide>) =>
    setSlides((current) => current.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)));

  const move = (index: number, direction: -1 | 1) =>
    setSlides((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <ActionForm action={saveHeroAction} successTitle="Hero published">
      <input type="hidden" name="slides" value={JSON.stringify(slides)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Trust line"
          htmlFor="trustMicrocopy"
          hint="The small reassurance under the buttons."
          error={useFieldError("trustMicrocopy")}
        >
          <Input id="trustMicrocopy" name="trustMicrocopy" defaultValue={content.trustMicrocopy} />
        </Field>

        <Field
          label="Slide interval (ms)"
          htmlFor="intervalMs"
          hint="How long each slide stays. 7000 = 7 seconds."
          error={useFieldError("intervalMs")}
        >
          <Input
            id="intervalMs"
            name="intervalMs"
            type="number"
            min={3500}
            max={20000}
            step={500}
            defaultValue={content.intervalMs}
          />
        </Field>
      </div>

      <Field
        label="Highlight bullets"
        htmlFor="highlights"
        hint="One per line, up to four. Shown with a tick under the intro text."
        error={useFieldError("highlights")}
      >
        <Textarea id="highlights" name="highlights" rows={3} defaultValue={content.highlights.join("\n")} />
      </Field>

      <label className="flex items-center gap-2.5 text-step--1">
        <Checkbox name="autoplay" defaultChecked={content.autoplay} />
        Rotate slides automatically (pauses on hover, and for reduced-motion visitors)
      </label>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-step--1 font-medium text-ink">Slides ({slides.length})</p>
          <Button
            variant="outline"
            size="sm"
            disabled={slides.length >= 5}
            onClick={() => {
              const id = `h${Date.now().toString(36)}`;
              setSlides((current) => [...current, { id, ...BLANK }]);
              setOpenId(id);
            }}
          >
            <Plus className="h-4 w-4" />
            Add slide
          </Button>
        </div>

        <div className="mt-3 space-y-3">
          {slides.map((slide, index) => {
            const open = openId === slide.id;
            return (
              <div key={slide.id} className="overflow-hidden rounded-lg border border-line">
                <div className="flex items-center gap-2 bg-surface-2 px-3 py-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : slide.id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="truncate text-step--1 font-medium text-ink">
                      {slide.headline || `Slide ${index + 1}`}
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
                    />
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move down"
                      disabled={index === slides.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove slide"
                      disabled={slides.length === 1}
                      onClick={() => setSlides((current) => current.filter((s) => s.id !== slide.id))}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>

                {open ? (
                  <div className="space-y-4 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Eyebrow" htmlFor={`eb-${slide.id}`} hint="Small label above the headline.">
                        <Input
                          id={`eb-${slide.id}`}
                          value={slide.eyebrow}
                          onChange={(event) => update(slide.id, { eyebrow: event.target.value })}
                        />
                      </Field>
                      <Field
                        label="Accent word"
                        htmlFor={`hl-${slide.id}`}
                        hint="One word from the headline, coloured in the accent."
                      >
                        <Input
                          id={`hl-${slide.id}`}
                          value={slide.highlight ?? ""}
                          onChange={(event) => update(slide.id, { highlight: event.target.value })}
                        />
                      </Field>
                    </div>

                    <Field label="Headline" htmlFor={`hd-${slide.id}`}>
                      <Input
                        id={`hd-${slide.id}`}
                        value={slide.headline}
                        onChange={(event) => update(slide.id, { headline: event.target.value })}
                      />
                    </Field>

                    <Field label="Intro text" htmlFor={`sh-${slide.id}`}>
                      <Textarea
                        id={`sh-${slide.id}`}
                        rows={3}
                        value={slide.subheadline}
                        onChange={(event) => update(slide.id, { subheadline: event.target.value })}
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Primary button — label" htmlFor={`p1-${slide.id}`}>
                        <Input
                          id={`p1-${slide.id}`}
                          value={slide.primaryCta.label}
                          onChange={(event) =>
                            update(slide.id, { primaryCta: { ...slide.primaryCta, label: event.target.value } })
                          }
                        />
                      </Field>
                      <Field label="Primary button — link" htmlFor={`p2-${slide.id}`} hint="e.g. /contact">
                        <Input
                          id={`p2-${slide.id}`}
                          value={slide.primaryCta.href}
                          onChange={(event) =>
                            update(slide.id, { primaryCta: { ...slide.primaryCta, href: event.target.value } })
                          }
                        />
                      </Field>
                      <Field label="Secondary button — label" htmlFor={`s1-${slide.id}`}>
                        <Input
                          id={`s1-${slide.id}`}
                          value={slide.secondaryCta.label}
                          onChange={(event) =>
                            update(slide.id, { secondaryCta: { ...slide.secondaryCta, label: event.target.value } })
                          }
                        />
                      </Field>
                      <Field label="Secondary button — link" htmlFor={`s2-${slide.id}`} hint="e.g. /work">
                        <Input
                          id={`s2-${slide.id}`}
                          value={slide.secondaryCta.href}
                          onChange={(event) =>
                            update(slide.id, { secondaryCta: { ...slide.secondaryCta, href: event.target.value } })
                          }
                        />
                      </Field>
                    </div>

                    <ImageUpload
                      label="Slide image"
                      guidance={IMAGE_GUIDANCE.heroSlide}
                      folder="hyascka/hero"
                      value={slide.imageUrl ?? ""}
                      onChange={(url) => update(slide.id, { imageUrl: url })}
                    />
                    <p className="text-step--2 text-ink-muted">
                      Leave the image empty to show the animated network graphic instead.
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <SubmitButton>Save & publish hero</SubmitButton>
    </ActionForm>
  );
}
