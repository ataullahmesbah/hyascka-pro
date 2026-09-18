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

/**
 * "Title | Detail" per line, for the paired lists on a service page.
 *
 * A line with no pipe is still a valid entry — the title carries it and the
 * detail is simply empty, which beats discarding what someone typed.
 */
function splitTitledLines(value?: string) {
  return splitLines(value).map((line) => {
    const [title, ...detail] = line.split("|");
    return { title: title.trim(), detail: detail.join("|").trim() };
  });
}

/**
 * Prisma's duplicate-key failure, as something the person filling in the form
 * can act on.
 *
 * Slugs are unique per table, so reusing one is an ordinary mistake — the same
 * class of thing as leaving a field blank. It was reaching the browser as an
 * unhandled 500 instead, which reads as "the site is broken" rather than
 * "pick another address".
 */
function duplicateFieldError(error: unknown, what: string): ActionState | null {
  if (typeof error !== "object" || error === null) return null;
  if ((error as { code?: unknown }).code !== "P2002") return null;

  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  const fields = Array.isArray(target) ? target.map(String) : [String(target ?? "")];

  if (fields.includes("slug")) {
    const message = `Another ${what} already uses that web address. Change the slug and save again.`;
    return { ok: false, message, fieldErrors: { slug: [message] } };
  }

  const named = fields.filter(Boolean).join(", ");
  const message = `Another ${what} already uses that ${named || "value"}.`;
  return { ok: false, message };
}

/**
 * One package per line:
 *
 *   Name | Price | Billing | Summary | Feature; Feature; Feature
 *
 * An empty price is a package we quote rather than list. A leading `*` on the
 * name marks the one to highlight, which is how the middle card gets its
 * emphasis without a separate control for it.
 */
function parsePackages(value?: string) {
  return splitLines(value)
    .map((line) => {
      const [rawName = "", rawPrice = "", billingCycle = "", summary = "", rawFeatures = ""] =
        line.split("|").map((part) => part.trim());
      const highlighted = rawName.startsWith("*");
      const name = (highlighted ? rawName.slice(1) : rawName).trim();
      const price = rawPrice ? Number(rawPrice.replace(/[^0-9.]/g, "")) : NaN;
      return {
        name,
        highlighted,
        price: Number.isFinite(price) ? price : null,
        billingCycle,
        summary,
        features: rawFeatures
          .split(";")
          .map((feature) => feature.trim())
          .filter(Boolean),
      };
    })
    .filter((row) => row.name);
}

export async function saveServiceAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await authorize("services.manage");

  const parsed = serviceContentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return toActionState(parsed.error);
  const {
    id,
    categorySlug,
    deliverables,
    technologies,
    features,
    processSteps,
    faqs,
    packages,
    startingPrice,
    ...rest
  } = parsed.data;

  const category = categorySlug
    ? await prisma.serviceCategory.findUnique({ where: { slug: categorySlug }, select: { id: true } })
    : null;

  const data = {
    ...rest,
    slug: slugify(rest.slug),
    categoryId: category?.id ?? null,
    deliverables: splitLines(deliverables),
    technologies: splitLines(technologies),
    processSteps: splitTitledLines(processSteps),
    startingPrice: startingPrice ?? null,
    tagline: rest.tagline || null,
    icon: rest.icon || null,
    timeline: rest.timeline || null,
    metaTitle: rest.metaTitle || null,
    metaDescription: rest.metaDescription || null,
  };

  let service;
  try {
    service = id
      ? await prisma.service.update({ where: { id }, data, select: { id: true, slug: true, title: true } })
      : await prisma.service.create({ data, select: { id: true, slug: true, title: true } });
  } catch (error) {
    const duplicate = duplicateFieldError(error, "service");
    if (duplicate) return duplicate;
    throw error;
  }

  /*
   * Features live in their own table, so the list is replaced wholesale rather
   * than diffed: the form is the whole truth about them, and matching rows up
   * by title would silently drop a renamed one.
   */
  const featureRows = splitTitledLines(features);
  const faqRows = splitTitledLines(faqs).filter((row) => row.title && row.detail);
  const packageRows = parsePackages(packages);

  await prisma.$transaction([
    prisma.serviceFeature.deleteMany({ where: { serviceId: service.id } }),
    ...(featureRows.length
      ? [
          prisma.serviceFeature.createMany({
            data: featureRows.map((feature, index) => ({
              serviceId: service.id,
              title: feature.title,
              detail: feature.detail || null,
              position: index,
            })),
          }),
        ]
      : []),

    prisma.serviceFAQ.deleteMany({ where: { serviceId: service.id } }),
    ...(faqRows.length
      ? [
          prisma.serviceFAQ.createMany({
            data: faqRows.map((faq, index) => ({
              serviceId: service.id,
              question: faq.title,
              answer: faq.detail,
              position: index,
            })),
          }),
        ]
      : []),

    prisma.servicePackage.deleteMany({ where: { serviceId: service.id } }),
    ...(packageRows.length
      ? [
          prisma.servicePackage.createMany({
            data: packageRows.map((row, index) => ({
              serviceId: service.id,
              name: row.name,
              summary: row.summary || null,
              price: row.price,
              currency: data.currency,
              // No price means we are not publishing one, which is a quote.
              pricingModel: row.price === null ? "CUSTOM_QUOTE" : "FIXED",
              billingCycle: row.billingCycle || null,
              features: row.features,
              highlighted: row.highlighted,
              position: index,
            })),
          }),
        ]
      : []),
  ]);

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

  let post;
  try {
    post = id
      ? await prisma.blogPost.update({ where: { id }, data, select: { id: true, slug: true, title: true } })
      : await prisma.blogPost.create({ data, select: { id: true, slug: true, title: true } });
  } catch (error) {
    const duplicate = duplicateFieldError(error, "article");
    if (duplicate) return duplicate;
    throw error;
  }

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

  let row;
  try {
    row = id
      ? await prisma.caseStudy.update({ where: { id }, data, select: { id: true, slug: true, title: true } })
      : await prisma.caseStudy.create({
          data: { ...data, metrics: [], services: [] },
          select: { id: true, slug: true, title: true },
        });
  } catch (error) {
    const duplicate = duplicateFieldError(error, "case study");
    if (duplicate) return duplicate;
    throw error;
  }

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
    slides,
    chooserLabel: formData.get("chooserLabel"),
    agencyLabel: formData.get("agencyLabel"),
    consultingLabel: formData.get("consultingLabel"),
    consultingEyebrow: formData.get("consultingEyebrow"),
    consultingHeadline: formData.get("consultingHeadline"),
    consultingHighlight: formData.get("consultingHighlight"),
    consultingSubheadline: formData.get("consultingSubheadline"),
    consultingPoints: formData.get("consultingPoints"),
    consultingPrimaryLabel: formData.get("consultingPrimaryLabel"),
    consultingPrimaryHref: formData.get("consultingPrimaryHref"),
    consultingSecondaryLabel: formData.get("consultingSecondaryLabel"),
    consultingSecondaryHref: formData.get("consultingSecondaryHref"),
    clients: formData.get("clients"),
  });
  if (!parsed.success) return toActionState(parsed.error);

  const page = await prisma.page.findUnique({ where: { slug: "home" }, select: { id: true } });
  if (!page) return { ok: false, message: "Homepage record is missing. Run the seed first." };

  const input = parsed.data;
  const clients = splitLines(input.clients).slice(0, 6);
  const consultingPoints = splitLines(input.consultingPoints).slice(0, 6);

  const data = {
    autoplay: input.autoplay,
    intervalMs: input.intervalMs,
    slides: input.slides,

    chooserLabel: input.chooserLabel || "",
    agencyLabel: input.agencyLabel || "",
    consultingLabel: input.consultingLabel || "",
    consultingEyebrow: input.consultingEyebrow || "",
    /*
     * An empty headline is how the chooser is switched off: the hero shows the
     * agency panel alone rather than a toggle onto an empty page.
     */
    consultingHeadline: input.consultingHeadline || "",
    consultingHighlight: input.consultingHighlight || "",
    consultingSubheadline: input.consultingSubheadline || "",
    consultingPoints,
    consultingPrimaryCta: {
      label: input.consultingPrimaryLabel || "",
      href: input.consultingPrimaryHref || "",
    },
    consultingSecondaryCta: {
      label: input.consultingSecondaryLabel || "",
      href: input.consultingSecondaryHref || "",
    },
    clients,
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
