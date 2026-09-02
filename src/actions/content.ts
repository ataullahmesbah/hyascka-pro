"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import {
  caseStudySchema,
  faqSchema as faqContentSchema,
  heroSettingsSchema,
  homepageSectionSchema,
  postContentSchema,
  serviceContentSchema,
  testimonialSchema,
  toActionState,
  type ActionState,
} from "@/lib/validation";

/**
 * CMS writes (PRD §18, §47). Publishing calls `revalidatePath` so a change is
 * live in seconds without a rebuild (§40.1), and every publish is audited.
 */

function splitLines(value?: string) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveServiceAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("services.manage");

  const parsed = serviceContentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { id, categorySlug, deliverables, technologies, startingPrice, ...rest } = parsed.data;

  const category = categorySlug
    ? await prisma.serviceCategory.findUnique({ where: { slug: categorySlug }, select: { id: true } })
    : null;

  const data = {
    ...rest,
    slug: slugify(rest.slug),
    categoryId: category?.id ?? null,
    deliverables: splitLines(deliverables),
    technologies: splitLines(technologies),
    startingPrice: startingPrice ?? null,
    tagline: rest.tagline || null,
    icon: rest.icon || null,
    timeline: rest.timeline || null,
    metaTitle: rest.metaTitle || null,
    metaDescription: rest.metaDescription || null,
  };

  const service = id
    ? await prisma.service.update({ where: { id }, data, select: { id: true, slug: true, title: true } })
    : await prisma.service.create({ data, select: { id: true, slug: true, title: true } });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: id ? "service.updated" : "service.created",
    entityType: "Service",
    entityId: service.id,
    summary: `Service "${service.title}" ${id ? "updated" : "created"} (${rest.status})`,
  });

  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/dashboard/services");
  return { ok: true, message: `Service saved and ${rest.status === "PUBLISHED" ? "published" : "kept as draft"}.` };
}

export async function savePostAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("content.manage");

  const parsed = postContentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { id, categoryName, ...rest } = parsed.data;

  if (rest.status === "PUBLISHED") {
    // Publishing is a separate, higher permission than editing (PRD §12).
    await authorize("content.publish");
  }

  const category = await prisma.category.upsert({
    where: { slug: slugify(categoryName) },
    update: {},
    create: { slug: slugify(categoryName), name: categoryName },
    select: { id: true },
  });

  const data = {
    ...rest,
    slug: slugify(rest.slug),
    categoryId: category.id,
    authorId: user.id,
    publishedAt: rest.status === "PUBLISHED" ? new Date() : null,
    metaTitle: rest.metaTitle || null,
    metaDescription: rest.metaDescription || null,
  };

  const post = id
    ? await prisma.blogPost.update({ where: { id }, data, select: { id: true, slug: true, title: true } })
    : await prisma.blogPost.create({ data, select: { id: true, slug: true, title: true } });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: rest.status === "PUBLISHED" ? "content.published" : "content.saved",
    entityType: "BlogPost",
    entityId: post.id,
    summary: `Article "${post.title}" ${id ? "updated" : "created"} (${rest.status})`,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/dashboard/content/blog");
  return { ok: true, message: "Article saved.", data: { id: post.id } };
}

export async function saveTestimonialAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("content.manage");

  const parsed = testimonialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { id, ...data } = parsed.data;

  const row = id
    ? await prisma.testimonial.update({ where: { id }, data, select: { id: true, author: true } })
    : await prisma.testimonial.create({ data, select: { id: true, author: true } });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.testimonial",
    entityType: "Testimonial",
    entityId: row.id,
    summary: `Testimonial from ${row.author} saved`,
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/dashboard/content/testimonials");
  return { ok: true, message: "Testimonial saved." };
}

export async function saveFaqAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const user = await authorize("content.manage");

  const parsed = faqContentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { id, ...data } = parsed.data;

  const row = id
    ? await prisma.fAQ.update({ where: { id }, data, select: { id: true } })
    : await prisma.fAQ.create({ data, select: { id: true } });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.faq",
    entityType: "FAQ",
    entityId: row.id,
    summary: "FAQ entry saved",
  });

  revalidatePath("/faq");
  revalidatePath("/");
  revalidatePath("/dashboard/content/faq");
  return { ok: true, message: "FAQ saved." };
}

export async function saveCaseStudyAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("content.manage");

  const parsed = caseStudySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const { id, ...rest } = parsed.data;
  const data = { ...rest, slug: slugify(rest.slug) };

  const row = id
    ? await prisma.caseStudy.update({ where: { id }, data, select: { id: true, slug: true, title: true } })
    : await prisma.caseStudy.create({
        data: { ...data, metrics: [], services: [] },
        select: { id: true, slug: true, title: true },
      });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.case_study",
    entityType: "CaseStudy",
    entityId: row.id,
    summary: `Case study "${row.title}" saved (${rest.status})`,
  });

  revalidatePath("/work");
  revalidatePath(`/work/${row.slug}`);
  revalidatePath("/dashboard/content/case-studies");
  return { ok: true, message: "Case study saved." };
}

/**
 * Homepage sections are edited as structured JSON with a schema-checked shape.
 * Invalid JSON is rejected before it can reach the public site.
 */
export async function saveHomepageSectionAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("content.manage");

  const parsed = homepageSectionSchema.safeParse({
    ...Object.fromEntries(formData),
    enabled: formData.get("enabled") === "on",
  });
  if (!parsed.success) return toActionState(parsed.error);

  let data: unknown;
  try {
    data = JSON.parse(parsed.data.data);
  } catch {
    return {
      ok: false,
      message: "That section content is not valid JSON. Check for a missing comma or quote.",
      fieldErrors: { data: ["Invalid JSON."] },
    };
  }

  const page = await prisma.page.findUnique({ where: { slug: "home" }, select: { id: true } });
  if (!page) return { ok: false, message: "Homepage record is missing. Run the seed first." };

  await prisma.pageSection.upsert({
    where: { pageId_key: { pageId: page.id, key: parsed.data.key } },
    update: { data: data as object, enabled: parsed.data.enabled },
    create: {
      pageId: page.id,
      key: parsed.data.key,
      type: "custom",
      data: data as object,
      enabled: parsed.data.enabled,
    },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.homepage",
    entityType: "PageSection",
    entityId: parsed.data.key,
    summary: `Homepage section "${parsed.data.key}" ${parsed.data.enabled ? "updated" : "disabled"}`,
  });

  revalidatePath("/");
  revalidatePath("/dashboard/content/homepage");
  return { ok: true, message: "Homepage section saved and published." };
}

/**
 * Hero slider editor (PRD §4). Structured fields, not raw JSON — a non-developer
 * has to be able to change the headline without meeting a syntax error.
 */
export async function saveHeroAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("content.manage");

  let slides: unknown = [];
  try {
    slides = JSON.parse(String(formData.get("slides") ?? "[]"));
  } catch {
    return { ok: false, message: "The slide list could not be read. Reload the page and try again." };
  }

  const parsed = heroSettingsSchema.safeParse({
    autoplay: formData.get("autoplay") === "on",
    intervalMs: formData.get("intervalMs"),
    trustMicrocopy: formData.get("trustMicrocopy"),
    highlights: formData.get("highlights"),
    slides,
  });
  if (!parsed.success) return toActionState(parsed.error);

  const highlights = (parsed.data.highlights ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  const page = await prisma.page.findUnique({ where: { slug: "home" }, select: { id: true } });
  if (!page) return { ok: false, message: "Homepage record is missing. Run the seed first." };

  const data = {
    autoplay: parsed.data.autoplay,
    intervalMs: parsed.data.intervalMs,
    trustMicrocopy: parsed.data.trustMicrocopy,
    highlights,
    slides: parsed.data.slides,
  };

  await prisma.pageSection.upsert({
    where: { pageId_key: { pageId: page.id, key: "hero" } },
    update: { data: data as object, enabled: true },
    create: { pageId: page.id, key: "hero", type: "hero", title: "Hero", data: data as object, position: 1 },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.hero",
    entityType: "PageSection",
    entityId: "hero",
    summary: `Homepage hero updated (${parsed.data.slides.length} slides)`,
  });

  revalidatePath("/");
  revalidatePath("/dashboard/content/homepage");
  return { ok: true, message: "Hero saved and published." };
}

/**
 * Permanent removal.
 *
 * Kept separate from archiving on purpose: the everyday button archives, so a
 * mis-click is recoverable, and this one is only offered once an item is
 * already archived. That way "delete" really deletes when an admin means it,
 * without making it the easy thing to hit by accident (PRD §47).
 */
export async function purgeContentAction(
  entity: "testimonial" | "faq" | "post" | "caseStudy",
  id: string,
) {
  const user = await authorize("content.manage");

  switch (entity) {
    case "testimonial":
      await prisma.testimonial.delete({ where: { id } });
      revalidatePath("/dashboard/content/testimonials");
      break;
    case "faq":
      await prisma.fAQ.delete({ where: { id } });
      revalidatePath("/dashboard/content/faq");
      break;
    case "post":
      await prisma.blogPost.delete({ where: { id } });
      revalidatePath("/dashboard/content/blog");
      break;
    case "caseStudy":
      await prisma.caseStudy.delete({ where: { id } });
      revalidatePath("/dashboard/content/case-studies");
      break;
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.deleted",
    entityType: entity,
    entityId: id,
    summary: `${entity} permanently deleted`,
  });

  revalidatePath("/", "layout");
}

/** Puts an archived item back into the editor as a draft. */
export async function restoreContentAction(
  entity: "testimonial" | "faq" | "post" | "caseStudy",
  id: string,
) {
  const user = await authorize("content.manage");
  const data = { status: "DRAFT" as const };

  switch (entity) {
    case "testimonial":
      await prisma.testimonial.update({ where: { id }, data });
      revalidatePath("/dashboard/content/testimonials");
      break;
    case "faq":
      await prisma.fAQ.update({ where: { id }, data });
      revalidatePath("/dashboard/content/faq");
      break;
    case "post":
      await prisma.blogPost.update({ where: { id }, data });
      revalidatePath("/dashboard/content/blog");
      break;
    case "caseStudy":
      await prisma.caseStudy.update({ where: { id }, data });
      revalidatePath("/dashboard/content/case-studies");
      break;
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.restored",
    entityType: entity,
    entityId: id,
    summary: `${entity} restored as a draft`,
  });

  revalidatePath("/", "layout");
}

export async function deleteContentAction(
  entity: "testimonial" | "faq" | "post" | "caseStudy",
  id: string,
) {
  const user = await authorize("content.manage");

  // Content is archived rather than removed, so a mistake is recoverable
  // (PRD §47 — non-technical admins need to be able to undo).
  switch (entity) {
    case "testimonial":
      await prisma.testimonial.update({ where: { id }, data: { status: "ARCHIVED" } });
      revalidatePath("/dashboard/content/testimonials");
      break;
    case "faq":
      await prisma.fAQ.update({ where: { id }, data: { status: "ARCHIVED" } });
      revalidatePath("/dashboard/content/faq");
      break;
    case "post":
      await prisma.blogPost.update({ where: { id }, data: { status: "ARCHIVED" } });
      revalidatePath("/dashboard/content/blog");
      break;
    case "caseStudy":
      await prisma.caseStudy.update({ where: { id }, data: { status: "ARCHIVED" } });
      revalidatePath("/dashboard/content/case-studies");
      break;
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "content.archived",
    entityType: entity,
    entityId: id,
    summary: `${entity} archived (recoverable)`,
  });

  revalidatePath("/", "layout");
}
