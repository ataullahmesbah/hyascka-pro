"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/guards";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import {
  caseStudySchema,
  faqSchema as faqContentSchema,
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
