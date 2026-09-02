export type PricingModelKey =
  | "FIXED"
  | "STARTING_FROM"
  | "CUSTOM_QUOTE"
  | "MONTHLY_RETAINER"
  | "HIDDEN";

export type ServiceSeed = {
  slug: string;
  title: string;
  categorySlug: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  icon: string;
  deliverables: string[];
  technologies: string[];
  processSteps: { title: string; detail: string }[];
  timeline: string;
  pricingModel: PricingModelKey;
  startingPrice: number | null;
  currency: string;
  featured: boolean;
  position: number;
  features: { title: string; detail: string }[];
  faqs: { question: string; answer: string }[];
  packages?: {
    name: string;
    summary: string;
    price: number | null;
    billingCycle?: string;
    pricingModel: PricingModelKey;
    features: string[];
    highlighted?: boolean;
  }[];
};

export type CaseStudySeed = {
  slug: string;
  title: string;
  client: string;
  industry: string;
  summary: string;
  challenge: string;
  solution: string;
  outcome: string;
  metrics: { label: string; value: string }[];
  services: string[];
  featured: boolean;
  position: number;
};

export type IndustrySeed = {
  slug: string;
  name: string;
  headline: string;
  description: string;
  challenges: string[];
  solutions: string[];
  icon: string;
  position: number;
};

export type TestimonialSeed = {
  author: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  position: number;
};

export type FaqSeed = { question: string; answer: string; category: string; position: number };

export type PostSeed = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  categoryName: string;
  tags: string[];
  readMinutes: number;
  publishedAt: string;
  /** Cover image, uploaded from the CMS. Falls back to a generated card. */
  coverImage?: string | null;
};

export type TeamSeed = { name: string; role: string; bio: string; position: number };

export type NavItemSeed = { location: string; label: string; href: string; position: number };
