import type { Metadata } from "next";

import { getSettings } from "@/lib/settings";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

type PageMetaInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
};

/** Builds unique, canonical-correct metadata for an indexable page (PRD §23). */
export async function pageMetadata(input: PageMetaInput = {}): Promise<Metadata> {
  const { seo, brand } = await getSettings();
  const title = input.title ? input.title : seo.defaultTitle;
  const description = input.description ?? seo.defaultDescription;
  const url = absoluteUrl(input.path ?? "/");
  const image = absoluteUrl(input.image ?? seo.ogImage);
  const robots = input.noIndex ? "noindex, nofollow" : seo.robots;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots,
    openGraph: {
      type: input.type ?? "website",
      title,
      description,
      url,
      siteName: brand.siteName,
      images: [{ url: image, width: 1200, height: 630, alt: brand.siteName }],
      locale: "en_US",
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      ...(seo.twitterHandle ? { creator: seo.twitterHandle } : {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data (PRD §23) — emitted only where the markup is genuinely valid.
// ---------------------------------------------------------------------------

export async function organizationSchema() {
  const { brand, contact, social } = await getSettings();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.siteName,
    url: siteUrl(),
    logo: absoluteUrl("/android-chrome-512x512.png"),
    description: brand.description,
    email: contact.email,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.addressLine,
      addressLocality: contact.city,
      addressCountry: contact.country,
    },
    sameAs: social.map((item) => item.href),
  };
}

export function serviceSchema(service: {
  title: string;
  shortDescription: string;
  slug: string;
  startingPrice: number | null;
  currency: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription,
    url: absoluteUrl(`/services/${service.slug}`),
    provider: { "@type": "Organization", name: "HYASCKA", url: siteUrl() },
    areaServed: "Worldwide",
    ...(service.startingPrice
      ? {
          offers: {
            "@type": "Offer",
            price: service.startingPrice,
            priceCurrency: service.currency,
            url: absoluteUrl(`/services/${service.slug}`),
          },
        }
      : {}),
  };
}

export function articleSchema(post: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    url: absoluteUrl(`/blog/${post.slug}`),
    image: absoluteUrl("/og-image.png"),
    author: { "@type": "Organization", name: "HYASCKA" },
    publisher: {
      "@type": "Organization",
      name: "HYASCKA",
      logo: { "@type": "ImageObject", url: absoluteUrl("/android-chrome-512x512.png") },
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
