import { z } from "zod";
import { FONT_IDS } from "@/lib/fonts";

/**
 * Every API route and Server Action parses its input with one of these before
 * touching the database (PRD §41.2, §41.3).
 */

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const name = z.string().trim().min(2, "Enter your full name.").max(120);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200)
  .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value), {
    message: "Include an uppercase letter, a lowercase letter and a number.",
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(200),
  redirectTo: z.string().max(200).optional(),
});

export const registerSchema = z
  .object({
    name,
    email,
    company: optionalText(160),
    phone: optionalText(32),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal("on", { errorMap: () => ({ message: "Accept the terms to continue." }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name,
  email,
  phone: optionalText(32),
  company: optionalText(160),
  serviceSlug: optionalText(80),
  budget: optionalText(60),
  message: z.string().trim().min(20, "Tell us a little more — at least 20 characters.").max(4000),
  /** Honeypot: bots fill hidden fields, humans do not (PRD §17 anti-spam). */
  website: z.string().max(0, "Submission rejected.").optional().or(z.literal("")),
  consent: z.literal("on", { errorMap: () => ({ message: "Please accept the privacy policy." }) }),
});

export const newsletterSchema = z.object({ email, website: z.string().max(0).optional().or(z.literal("")) });

export const profileSchema = z.object({
  name,
  phone: optionalText(32),
  companyName: optionalText(160),
  billingEmail: z.union([email, z.literal("")]).optional(),
  billingPhone: optionalText(32),
  addressLine1: optionalText(200),
  city: optionalText(80),
  country: optionalText(80),
  taxId: optionalText(60),
});

export const paymentSubmissionSchema = z.object({
  invoiceId: z.string().min(1),
  method: z.enum(["BKASH", "NAGAD", "BANK_TRANSFER", "SSLCOMMERZ", "CASH"]),
  amount: z.coerce.number().positive("Enter the amount you paid.").max(100_000_000),
  trxId: z
    .string()
    .trim()
    .min(4, "Enter the transaction ID from your payment confirmation.")
    .max(64)
    .regex(/^[A-Za-z0-9._-]+$/, "Transaction IDs contain letters, numbers, dots, dashes and underscores."),
  senderNumber: optionalText(32),
  proofUrl: optionalText(500),
});

export const paymentDecisionSchema = z.object({
  paymentId: z.string().min(1),
  decision: z.enum(["VERIFY", "REJECT"]),
  reason: optionalText(500),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(5000),
  isInternalNote: z.coerce.boolean().optional(),
});

export const ticketSchema = z.object({
  subject: z.string().trim().min(5).max(160),
  category: z.string().trim().max(60).default("GENERAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  body: z.string().trim().min(10, "Describe the issue.").max(4000),
});

export const serviceRequestSchema = z.object({
  serviceSlug: optionalText(80),
  title: z.string().trim().min(5).max(160),
  brief: z.string().trim().min(20).max(4000),
  budget: optionalText(60),
  deadline: optionalText(30),
});

export const leadUpdateSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"]),
  ownerId: z.string().max(40).optional().or(z.literal("")),
  note: optionalText(2000),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Choose a client."),
  dueDate: z.string().min(4, "Choose a due date."),
  currency: z.string().length(3).default("BDT"),
  notes: optionalText(1000),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(2).max(200),
        quantity: z.coerce.number().int().positive().max(9999),
        unitPrice: z.coerce.number().nonnegative().max(100_000_000),
        discount: z.coerce.number().nonnegative().max(100_000_000).default(0),
        taxRate: z.coerce.number().min(0).max(100).default(0),
      }),
    )
    .min(1, "Add at least one line item."),
});

export const expenseSchema = z.object({
  category: z.string().trim().min(2).max(60),
  vendor: optionalText(120),
  description: optionalText(500),
  amount: z.coerce.number().positive().max(100_000_000),
  currency: z.string().length(3).default("BDT"),
  spentAt: z.string().min(4),
});

export const userRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "FINANCE",
    "PROJECT_MANAGER",
    "EDITOR",
    "SUPPORT",
    "CLIENT",
  ]),
});

export const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED", "PENDING_VERIFICATION"]),
  reason: optionalText(300),
});

export const brandSettingsSchema = z.object({
  siteName: z.string().trim().min(2).max(60),
  tagline: z.string().trim().max(120),
  description: z.string().trim().max(400),
  logoUrl: z.string().trim().max(400),
  faviconUrl: z.string().trim().max(400),
});

/** Theme governance (PRD §1). A closed set — never free-form CSS. */
export const themeSettingsSchema = z
  .object({
    defaultTheme: z.enum(["light", "midnight", "network"]),
    enabledThemes: z
      .array(z.enum(["light", "midnight", "network"]))
      .min(1, "Enable at least one theme."),
    allowUserToggle: z.coerce.boolean(),
  })
  .refine((data) => data.enabledThemes.includes(data.defaultTheme), {
    message: "The default theme must be one of the enabled themes.",
    path: ["defaultTheme"],
  });

/** Currency and locale (PRD v5.1 §8). The site quotes in dollars by default. */
export const localizationSettingsSchema = z.object({
  currency: z.enum(["USD", "EUR", "GBP", "BDT"]),
  locale: z.string().trim().min(2).max(10),
  timezone: z.string().trim().min(3).max(60),
});

/** Typography (PRD v5.1 §2). Only the five shipped families are accepted. */
export const fontSettingsSchema = z.object({
  headingFont: z.enum(FONT_IDS),
  bodyFont: z.enum(FONT_IDS),
});

/** Sponsor marquee (PRD §4). Items are image or text — both are optional-safe. */
export const sponsorsSettingsSchema = z.object({
  enabled: z.coerce.boolean(),
  title: z.string().trim().min(3).max(120),
  direction: z.enum(["left", "right"]),
  speed: z.coerce.number().int().min(12, "Minimum 12 seconds.").max(180),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        label: z.string().trim().min(1, "A name is required.").max(80),
        imageUrl: z.string().trim().max(600).optional().or(z.literal("")),
        href: z.string().trim().max(600).optional().or(z.literal("")),
      }),
    )
    .max(40, "Keep the strip under 40 items."),
});

export const whatsappSettingsSchema = z.object({
  greeting: z.string().trim().min(5).max(300),
  label: z.string().trim().min(2).max(60),
  // The number lives on the contact settings, but it is edited here too —
  // this is the page an admin opens when they think "WhatsApp".
  phone: z
    .string()
    .trim()
    .max(24)
    .regex(/^\+?[0-9 ()-]*$/, "Digits only, optionally starting with +.")
    .optional()
    .or(z.literal("")),
});

export const assistantSettingsSchema = z.object({
  name: z.string().trim().min(1).max(40),
  greeting: z.string().trim().min(10).max(400),
  suggestions: z.string().max(600).optional().or(z.literal("")),
});

/** Hero slider (PRD §4). Two to three slides, each independently editable. */
export const heroSettingsSchema = z.object({
  autoplay: z.coerce.boolean(),
  intervalMs: z.coerce.number().int().min(3500).max(20000),
  trustMicrocopy: z.string().trim().max(200),
  highlights: z.string().max(600).optional().or(z.literal("")),
  slides: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        eyebrow: z.string().trim().min(2).max(60),
        headline: z.string().trim().min(8).max(120),
        highlight: z.string().trim().max(40).optional().or(z.literal("")),
        subheadline: z.string().trim().min(20).max(500),
        primaryCta: z.object({
          label: z.string().trim().min(2).max(40),
          href: z.string().trim().min(1).max(300),
        }),
        secondaryCta: z.object({
          label: z.string().trim().min(2).max(40),
          href: z.string().trim().min(1).max(300),
        }),
        imageUrl: z.string().trim().max(600).optional().or(z.literal("")),
      }),
    )
    .min(1, "At least one slide is required.")
    .max(5, "Keep the hero to five slides or fewer."),
});

/** Chat message accepted by the public assistant endpoint. */
export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Ask a question.").max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .max(12)
    .optional(),
});

/** Staff reply sent from a lead's detail page. */
export const leadReplySchema = z.object({
  leadId: z.string().min(1),
  subject: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10, "Write a reply.").max(6000),
});

/** Support ticket raised by a staff member on a client's behalf. */
export const staffTicketSchema = z.object({
  clientId: z.string().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(5).max(160),
  category: z.string().trim().max(60).default("INTERNAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.string().max(40).optional().or(z.literal("")),
  body: z.string().trim().min(10).max(4000),
});

export const ticketAssignSchema = z.object({
  ticketId: z.string().min(1),
  assigneeId: z.string().max(40),
});

export const contactSettingsSchema = z.object({
  email,
  supportEmail: email,
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  addressLine: z.string().trim().max(200),
  city: z.string().trim().max(80),
  country: z.string().trim().max(80),
  hours: z.string().trim().max(120),
  responseTime: z.string().trim().max(120),
});

export const seoSettingsSchema = z.object({
  defaultTitle: z.string().trim().min(4).max(70),
  titleTemplate: z.string().trim().max(70),
  defaultDescription: z.string().trim().min(50).max(200),
  ogImage: z.string().trim().max(400),
  robots: z.enum(["index, follow", "noindex, nofollow", "index, nofollow", "noindex, follow"]),
  twitterHandle: optionalText(40),
});

/** IDs only — free-form script injection is never accepted (PRD §47). */
export const trackingSettingsSchema = z.object({
  ga4Id: z.string().trim().max(30).regex(/^(G-[A-Z0-9]+)?$/, "Use a GA4 ID such as G-XXXXXXX.").or(z.literal("")),
  gtmId: z.string().trim().max(30).regex(/^(GTM-[A-Z0-9]+)?$/, "Use a container ID such as GTM-XXXXXX.").or(z.literal("")),
  clarityId: z.string().trim().max(30).regex(/^[a-z0-9]*$/i, "Clarity project IDs are alphanumeric.").or(z.literal("")),
  metaPixelId: z.string().trim().max(30).regex(/^[0-9]*$/, "Pixel IDs are numeric.").or(z.literal("")),
  metaCapiToken: z.string().trim().max(400).optional().or(z.literal("")),
  metaDatasetId: z.string().trim().max(40).optional().or(z.literal("")),
});

export const maintenanceSettingsSchema = z.object({
  bannerText: z.string().trim().max(300),
  isBannerActive: z.coerce.boolean(),
  isFullModeActive: z.coerce.boolean(),
  startAt: z.string().max(40).optional().or(z.literal("")),
  endAt: z.string().max(40).optional().or(z.literal("")),
});

export const paymentMethodSchema = z.object({
  method: z.enum(["BKASH", "NAGAD", "BANK_TRANSFER", "SSLCOMMERZ", "CASH"]),
  label: z.string().trim().min(2).max(60),
  isActive: z.coerce.boolean(),
  accountName: optionalText(120),
  accountNumber: optionalText(60),
  branch: optionalText(120),
  instructions: optionalText(600),
  minAmount: z.coerce.number().nonnegative().max(100_000_000).optional(),
  maxAmount: z.coerce.number().nonnegative().max(100_000_000).optional(),
  apiKey: optionalText(200),
  apiSecret: optionalText(200),
});

export const serviceContentSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3).max(120),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes."),
  tagline: optionalText(200),
  shortDescription: z.string().trim().min(20).max(400),
  longDescription: z.string().trim().min(50).max(8000),
  categorySlug: z.string().trim().max(80),
  icon: optionalText(60),
  timeline: optionalText(120),
  pricingModel: z.enum(["FIXED", "STARTING_FROM", "CUSTOM_QUOTE", "MONTHLY_RETAINER", "HIDDEN"]),
  startingPrice: z.coerce.number().nonnegative().max(100_000_000).optional(),
  currency: z.string().length(3).default("BDT"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.coerce.boolean().optional(),
  metaTitle: optionalText(70),
  metaDescription: optionalText(200),
  deliverables: z.string().max(4000).optional(),
  technologies: z.string().max(2000).optional(),
});

export const postContentSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5).max(160),
  slug: z.string().trim().min(3).max(160).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes."),
  excerpt: z.string().trim().min(20).max(400),
  content: z.string().trim().min(100).max(60000),
  categoryName: z.string().trim().max(60).default("Insights"),
  readMinutes: z.coerce.number().int().min(1).max(90).default(5),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  metaTitle: optionalText(70),
  metaDescription: optionalText(200),
  coverImage: optionalText(500),
});

export const testimonialSchema = z.object({
  id: z.string().optional(),
  author: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(80),
  company: optionalText(80),
  quote: z.string().trim().min(20).max(1000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  avatarUrl: optionalText(500),
});

/** Header and footer links (PRD v5.1 §5) — editable without touching code. */
export const navigationItemSchema = z.object({
  id: z.string().optional(),
  location: z.enum(["HEADER", "FOOTER_SERVICES", "FOOTER_COMPANY", "FOOTER_LEGAL"]),
  label: z.string().trim().min(1, "Give the link a label.").max(60),
  href: z
    .string()
    .trim()
    .min(1, "Where should the link go?")
    .max(300)
    .regex(
      /^(\/|https?:\/\/|mailto:|tel:)/,
      "Use a path starting with /, or a full https:// address.",
    ),
  position: z.coerce.number().int().min(0).max(999).default(0),
  enabled: z.coerce.boolean().default(true),
});

export const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(10).max(2000),
  category: z.string().trim().max(60).default("General"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export const caseStudySchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5).max(160),
  slug: z.string().trim().min(3).max(160).regex(/^[a-z0-9-]+$/),
  client: z.string().trim().min(2).max(120),
  industry: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(20).max(600),
  challenge: z.string().trim().min(20).max(4000),
  solution: z.string().trim().min(20).max(4000),
  outcome: z.string().trim().min(20).max(4000),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.coerce.boolean().optional(),
});

export const homepageSectionSchema = z.object({
  key: z.string().trim().min(2).max(60),
  enabled: z.coerce.boolean(),
  data: z.string().max(20000),
});

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
  data?: Record<string, unknown>;
};

/** Normalises a ZodError into the shape every form component consumes. */
export function toActionState(error: z.ZodError): ActionState {
  return {
    ok: false,
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}
