import { cache } from "react";

import { prisma, withFallback } from "@/lib/db";
import { serviceCategories, services as defaultServices } from "@/content/services";
import {
  caseStudies as defaultCaseStudies,
  faqs as defaultFaqs,
  industries as defaultIndustries,
  navigation as defaultNavigation,
  posts as defaultPosts,
  team as defaultTeam,
  testimonials as defaultTestimonials,
} from "@/content/marketing";
import { homepage as defaultHomepage } from "@/content/site";
import type {
  CaseStudySeed,
  FaqSeed,
  IndustrySeed,
  NavItemSeed,
  PostSeed,
  ServiceSeed,
  TeamSeed,
  TestimonialSeed,
} from "@/content/types";

/**
 * Public content reads. Each falls back to the bundled defaults when no
 * database is configured, so a fresh clone renders the full site immediately
 * and a database outage degrades to static content instead of a 500.
 *
 * Public pages are statically generated and revalidated (PRD §40.1); the CMS
 * calls `revalidatePath` on publish rather than waiting for a rebuild.
 */

export const REVALIDATE_SECONDS = 300;

export const getServices = cache(async (): Promise<ServiceSeed[]> =>
  withFallback(async () => {
    const rows = await prisma.service.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ position: "asc" }, { title: "asc" }],
      include: {
        category: { select: { slug: true } },
        features: { orderBy: { position: "asc" } },
        faqs: { orderBy: { position: "asc" } },
        packages: { orderBy: { position: "asc" } },
      },
    });
    if (!rows.length) return defaultServices;
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      categorySlug: row.category?.slug ?? "engineering",
      tagline: row.tagline ?? "",
      shortDescription: row.shortDescription,
      longDescription: row.longDescription,
      icon: row.icon ?? "Sparkles",
      deliverables: row.deliverables,
      technologies: row.technologies,
      processSteps: (row.processSteps as { title: string; detail: string }[] | null) ?? [],
      timeline: row.timeline ?? "",
      pricingModel: row.pricingModel,
      startingPrice: row.startingPrice ? Number(row.startingPrice) : null,
      currency: row.currency,
      featured: row.featured,
      position: row.position,
      features: row.features.map((f) => ({ title: f.title, detail: f.detail ?? "" })),
      faqs: row.faqs.map((f) => ({ question: f.question, answer: f.answer })),
      packages: row.packages.map((p) => ({
        name: p.name,
        summary: p.summary ?? "",
        price: p.price ? Number(p.price) : null,
        billingCycle: p.billingCycle ?? undefined,
        pricingModel: p.pricingModel,
        features: p.features,
        highlighted: p.highlighted,
      })),
    }));
  }, defaultServices),
);

export async function getServiceBySlug(slug: string) {
  const all = await getServices();
  return all.find((service) => service.slug === slug) ?? null;
}

export const getServiceCategories = cache(async () =>
  withFallback(async () => {
    const rows = await prisma.serviceCategory.findMany({ orderBy: { position: "asc" } });
    if (!rows.length) return [...serviceCategories];
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description ?? "",
      icon: row.icon ?? "Sparkles",
      position: row.position,
    }));
  }, [...serviceCategories]),
);

export const getCaseStudies = cache(async (): Promise<CaseStudySeed[]> =>
  withFallback(async () => {
    const rows = await prisma.caseStudy.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    if (!rows.length) return defaultCaseStudies;
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      client: row.client,
      industry: row.industry,
      summary: row.summary,
      challenge: row.challenge,
      solution: row.solution,
      outcome: row.outcome,
      metrics: (row.metrics as { label: string; value: string }[] | null) ?? [],
      services: row.services,
      featured: row.featured,
      position: row.position,
    }));
  }, defaultCaseStudies),
);

export async function getCaseStudyBySlug(slug: string) {
  const all = await getCaseStudies();
  return all.find((item) => item.slug === slug) ?? null;
}

export const getIndustries = cache(async (): Promise<IndustrySeed[]> =>
  withFallback(async () => {
    const rows = await prisma.industry.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { position: "asc" },
    });
    if (!rows.length) return defaultIndustries;
    return rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      headline: row.headline,
      description: row.description,
      challenges: row.challenges,
      solutions: row.solutions,
      icon: row.icon ?? "Building2",
      position: row.position,
    }));
  }, defaultIndustries),
);

export async function getIndustryBySlug(slug: string) {
  const all = await getIndustries();
  return all.find((item) => item.slug === slug) ?? null;
}

export const getTestimonials = cache(async (): Promise<TestimonialSeed[]> =>
  withFallback(async () => {
    const rows = await prisma.testimonial.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { position: "asc" },
    });
    if (!rows.length) return defaultTestimonials;
    return rows.map((row) => ({
      author: row.author,
      role: row.role,
      company: row.company ?? "",
      quote: row.quote,
      rating: row.rating,
      position: row.position,
    }));
  }, defaultTestimonials),
);

export const getFaqs = cache(async (): Promise<FaqSeed[]> =>
  withFallback(async () => {
    const rows = await prisma.fAQ.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { position: "asc" },
    });
    if (!rows.length) return defaultFaqs;
    return rows.map((row) => ({
      question: row.question,
      answer: row.answer,
      category: row.category,
      position: row.position,
    }));
  }, defaultFaqs),
);

export const getPosts = cache(async (): Promise<PostSeed[]> =>
  withFallback(async () => {
    const rows = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: { category: true, tags: { include: { tag: true } } },
    });
    if (!rows.length) return defaultPosts;
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      categorySlug: row.category?.slug ?? "insights",
      categoryName: row.category?.name ?? "Insights",
      tags: row.tags.map((t) => t.tag.slug),
      readMinutes: row.readMinutes,
      publishedAt: (row.publishedAt ?? row.createdAt).toISOString().slice(0, 10),
      coverImage: row.coverImage,
    }));
  }, defaultPosts),
);

export async function getPostBySlug(slug: string) {
  const all = await getPosts();
  return all.find((post) => post.slug === slug) ?? null;
}

export const getTeam = cache(async (): Promise<TeamSeed[]> =>
  withFallback(async () => {
    const rows = await prisma.teamMember.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { position: "asc" },
    });
    if (!rows.length) return defaultTeam;
    return rows.map((row) => ({
      name: row.name,
      role: row.role,
      bio: row.bio,
      position: row.position,
    }));
  }, defaultTeam),
);

export const getNavigation = cache(async (): Promise<NavItemSeed[]> =>
  withFallback(async () => {
    const rows = await prisma.navigationItem.findMany({
      where: { enabled: true },
      orderBy: { position: "asc" },
    });
    if (!rows.length) return defaultNavigation;
    return rows.map((row) => ({
      location: row.location,
      label: row.label,
      href: row.href,
      position: row.position,
    }));
  }, defaultNavigation),
);

export type HomepageContent = typeof defaultHomepage;

/** Homepage sections are stored as PageSection rows keyed by section name. */
export const getHomepage = cache(async (): Promise<HomepageContent> =>
  withFallback(async () => {
    const page = await prisma.page.findUnique({
      where: { slug: "home" },
      include: { sections: { orderBy: { position: "asc" } } },
    });
    if (!page) return defaultHomepage;

    const merged: HomepageContent = structuredClone(defaultHomepage);
    for (const section of page.sections) {
      const key = section.key as keyof HomepageContent;
      if (!(key in merged)) continue;
      if (!section.enabled) {
        if (key === "announcement") merged.announcement.enabled = false;
        continue;
      }
      if (section.data) {
        const base = merged[key];
        merged[key] = (
          Array.isArray(base) ? section.data : { ...(base as object), ...(section.data as object) }
        ) as never;
      }
    }
    return merged;
  }, defaultHomepage),
);
