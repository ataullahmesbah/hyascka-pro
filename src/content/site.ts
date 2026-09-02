import type { FontId } from "@/lib/fonts";
import type { ThemeId } from "@/lib/theme";

/**
 * Default values for every dashboard-controllable setting (PRD §46).
 * Each key here maps to a `SiteSetting` row once a database is connected.
 */

export const defaultBrand = {
  siteName: "HYASCKA",
  tagline: "Digital Service Provider",
  logoUrl: "/brand/logo-icon.svg",
  faviconUrl: "/favicon.ico",
  description:
    "HYASCKA is a digital service provider building fast, secure, measurable web platforms — and the search, paid media and automation programmes that grow them.",
};

/**
 * Theme governance (PRD §1). The site ships on Daylight; the dashboard decides
 * which themes visitors may choose between, and whether they may choose at all.
 */
export const defaultTheme = {
  defaultTheme: "light" as ThemeId,
  enabledThemes: ["light", "midnight", "network"] as ThemeId[],
  allowUserToggle: true,
};

/**
 * Typography (PRD v5.1 §2). Five families ship; these two are the default pair.
 */
export const defaultFonts = {
  headingFont: "plus-jakarta" as FontId,
  bodyFont: "inter" as FontId,
};

export const defaultContact = {
  email: "hello@hyascka.com",
  supportEmail: "support@hyascka.com",
  phone: "+880 1700 000000",
  whatsapp: "+8801700000000",
  addressLine: "Level 5, Bashundhara R/A",
  city: "Dhaka",
  country: "Bangladesh",
  hours: "Sunday–Thursday, 10:00–19:00 (GMT+6)",
  responseTime: "Replies within one business day",
};

export const defaultSocial = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/hyascka", icon: "Linkedin" },
  { label: "X", href: "https://x.com/hyascka", icon: "Twitter" },
  { label: "Facebook", href: "https://facebook.com/hyascka", icon: "Facebook" },
  { label: "GitHub", href: "https://github.com/hyascka", icon: "Github" },
];

export const defaultSeo = {
  defaultTitle: "HYASCKA — Digital Service Provider",
  titleTemplate: "%s · HYASCKA",
  defaultDescription:
    "Premium digital agency for web development, e-commerce, SEO, paid media and AI automation. Fast, secure, measurable platforms built to grow.",
  ogImage: "/og-image.png",
  robots: "index, follow",
  twitterHandle: "@hyascka",
};

export const defaultTracking = {
  ga4Id: "",
  gtmId: "",
  clarityId: "",
  metaPixelId: "",
};

export const defaultMaintenance = {
  bannerText: "",
  isBannerActive: false,
  isFullModeActive: false,
  startAt: null as string | null,
  endAt: null as string | null,
};

export const defaultNotifications = {
  emailEnabled: true,
  telegramEnabled: false,
  events: {
    LEAD_CREATED: true,
    CONTACT_SUBMITTED: true,
    MESSAGE_RECEIVED: true,
    PAYMENT_RECEIVED: true,
    INVOICE_OVERDUE: true,
    SECURITY_ALERT: true,
  },
};

export const defaultFeatureFlags = [
  { key: "whatsapp_widget", description: "Floating WhatsApp chat button on public pages.", enabled: true },
  { key: "ai_assistant", description: "Gemini-powered assistant that answers from published content.", enabled: true },
  { key: "sponsors_marquee", description: "Scrolling partner/sponsor strip on the homepage.", enabled: true },
  { key: "quote_calculator", description: "Interactive estimate calculator on service pages.", enabled: true },
  { key: "exit_intent_cta", description: "Show a single scroll/exit-intent CTA per session.", enabled: false },
  { key: "newsletter", description: "Footer newsletter subscription form.", enabled: true },
  { key: "referral_program", description: "Client referral codes and discounts.", enabled: false },
];

/**
 * Sponsor / partner marquee (PRD §4). Each item is an image *or* a text
 * wordmark, so the strip works before any logo has been uploaded.
 */
export const defaultSponsors = {
  enabled: true,
  title: "Trusted by teams building for growth",
  /** "left" | "right" */
  direction: "left" as "left" | "right",
  /** Seconds for one full loop — lower is faster. */
  speed: 38,
  items: [
    { id: "s1", label: "Northlane Systems", imageUrl: "", href: "" },
    { id: "s2", label: "Maison Rouge", imageUrl: "", href: "" },
    { id: "s3", label: "Vireo Health", imageUrl: "", href: "" },
    { id: "s4", label: "Trailpoint Logistics", imageUrl: "", href: "" },
    { id: "s5", label: "Aurora Collective", imageUrl: "", href: "" },
    { id: "s6", label: "Meridian Advisory", imageUrl: "", href: "" },
    { id: "s7", label: "Skyline Estates", imageUrl: "", href: "" },
    { id: "s8", label: "Orbit Fintech", imageUrl: "", href: "" },
  ],
};

/** WhatsApp widget copy — the number itself lives in contact settings. */
export const defaultWhatsapp = {
  greeting: "Hi HYASCKA — I would like to discuss a project.",
  label: "Chat on WhatsApp",
};

/** AI assistant copy. The API key is server-side only and never stored here. */
export const defaultAssistant = {
  name: "Hy",
  greeting:
    "Hi, I am Hy — HYASCKA's assistant. Ask me about our services, pricing, process or case studies.",
  suggestions: [
    "What does a website build cost?",
    "How long does an SEO engagement take?",
    "Which industries do you work with?",
    "How do payments and invoices work?",
  ],
};

/**
 * The site sells internationally, so prices are quoted in dollars by default.
 * An admin can switch the whole site to another currency from Settings →
 * Localization; taka is one of the options for local work.
 */
export const defaultLocalization = {
  currency: "USD",
  currencySymbol: "$",
  locale: "en",
  timezone: "Asia/Dhaka",
};

// ---------------------------------------------------------------------------
// Homepage sections (PRD §7) — every one of these is CMS-editable and can be
// reordered or disabled from Dashboard → Content → Homepage.
// ---------------------------------------------------------------------------

export const homepage = {
  announcement: {
    enabled: true,
    text: "Taking on new projects for Q4 2026 — two delivery slots remaining.",
    href: "/contact",
    linkLabel: "Start a project",
  },

  /**
   * Hero slider (PRD §4). Two to three slides, each independently editable from
   * Dashboard → Content → Homepage. The network visualisation behind them is
   * hand-built SVG, not an image, so it stays sharp and weighs nothing.
   */
  hero: {
    autoplay: true,
    intervalMs: 7000,
    slides: [
      {
        id: "h1",
        eyebrow: "Digital Service Provider",
        headline: "Digital work that can be measured.",
        highlight: "measured",
        subheadline:
          "We build fast, secure web platforms and run the search, paid media and automation programmes that turn them into pipeline. Everything we ship is instrumented, so you always know what it earned.",
        primaryCta: { label: "Start a project", href: "/contact" },
        secondaryCta: { label: "See our work", href: "/work" },
        imageUrl: "",
      },
      {
        id: "h2",
        eyebrow: "Engineering",
        headline: "Sites that load before your visitor gives up.",
        highlight: "before",
        subheadline:
          "A performance budget enforced in the deployment pipeline, not measured after launch. Ninety-plus Lighthouse is an acceptance criterion on every build we hand over.",
        primaryCta: { label: "See our engineering", href: "/services/web-development" },
        secondaryCta: { label: "Compare packages", href: "/pricing" },
        imageUrl: "",
      },
      {
        id: "h3",
        eyebrow: "Growth",
        headline: "Reporting you can defend upward.",
        highlight: "defend",
        subheadline:
          "Server-side conversion tracking, CRM-matched lead quality and monthly reporting written in the language of revenue rather than impressions.",
        primaryCta: { label: "Talk to us", href: "/contact" },
        secondaryCta: { label: "Browse services", href: "/services" },
        imageUrl: "",
      },
    ],
    trustMicrocopy: "Fixed-scope proposals · You own the code · No lock-in",
    highlights: [
      "90+ Lighthouse as an acceptance criterion",
      "WCAG 2.1 AA accessibility",
      "Reporting tied to revenue, not sessions",
    ],
  },

  capabilities: [
    { label: "Web Development", icon: "Code2", href: "/services/web-development" },
    { label: "E-commerce", icon: "ShoppingCart", href: "/services/ecommerce-development" },
    { label: "SEO", icon: "Search", href: "/services/seo" },
    { label: "Paid Media", icon: "TrendingUp", href: "/services/digital-marketing" },
    { label: "Brand & Design", icon: "Palette", href: "/services/graphic-design" },
    { label: "AI Automation", icon: "Bot", href: "/services/ai-automation" },
  ],

  whyUs: [
    {
      title: "Performance is an acceptance criterion",
      detail:
        "A page that does not hit its Core Web Vitals budget does not ship. We enforce it in the deployment pipeline, so speed does not quietly regress three sprints after launch.",
      icon: "Zap",
      span: "lg",
    },
    {
      title: "Security by default",
      detail:
        "Deny-by-default routing, server-side permission checks on every request and Server Actions treated as public endpoints — because that is what they are.",
      icon: "ShieldCheck",
      span: "sm",
    },
    {
      title: "Editable without us",
      detail:
        "Content, pricing, SEO and theme all live in your dashboard. We would rather you did not need to call us to change a headline.",
      icon: "PenSquare",
      span: "sm",
    },
    {
      title: "Reporting you can defend upward",
      detail:
        "Server-side conversion tracking, CRM-matched lead quality and monthly reporting written in the language of revenue rather than impressions.",
      icon: "BarChart3",
      span: "lg",
    },
  ],

  process: [
    { step: "01", title: "Discover", detail: "Goals, audience, constraints and the numbers that define success — agreed in writing before anything is designed." },
    { step: "02", title: "Strategy", detail: "Architecture, content model, channel plan and a performance budget. The decisions that are expensive to change later." },
    { step: "03", title: "Design", detail: "Design system first, then templates, reviewed on real devices rather than in a desktop mockup." },
    { step: "04", title: "Build", detail: "Two-week increments on a live staging URL, with automated lint, type and accessibility checks on every push." },
    { step: "05", title: "Launch", detail: "DNS and SSL cutover, analytics verification, a Lighthouse pass and a written rollback plan." },
    { step: "06", title: "Grow", detail: "Measurement, experiments and iteration. The launch is the start of the engagement, not the end." },
  ],

  metrics: [
    { label: "Projects delivered", value: 120, suffix: "+", detail: "Across engineering, search and brand" },
    { label: "Average Lighthouse score", value: 96, suffix: "/100", detail: "On delivered public pages" },
    { label: "Client retention", value: 92, suffix: "%", detail: "Clients continuing past first engagement" },
    { label: "Avg. first response", value: 4, suffix: "h", detail: "To client messages in working hours" },
  ],

  finalCta: {
    headline: "Tell us what you are trying to grow.",
    subheadline:
      "A 30-minute call, an honest read on whether we are the right fit, and a fixed-scope proposal if we are. No retainer pitch on the first call.",
    primaryCta: { label: "Book a discovery call", href: "/contact" },
    secondaryCta: { label: "Browse services", href: "/services" },
  },
};

export const aboutPage = {
  headline: "A small team that ships, measures and tells you the truth.",
  intro:
    "HYASCKA is a digital service provider working across engineering, search, paid media and brand. We are deliberately small: the people you meet in the first call are the people who do the work.",
  story: [
    "We started because too many businesses were paying for websites they could not edit, marketing they could not measure and reports that answered no useful question. The pattern was always the same — impressive deliverables, no accountability for outcomes.",
    "So we built the agency around the opposite default. Every engagement starts with the number it is meant to move. Every build ships with the instrumentation to prove whether it did. Every client owns their code, their accounts and their data outright, which means we have to keep earning the relationship.",
    "That is also why the platform you are looking at exists. Our clients get a real portal — projects, invoices, payments, messages and files in one place — instead of a monthly PDF and a thread of emails.",
  ],
  values: [
    { title: "Say the inconvenient thing", detail: "If a budget is too small to learn from, or a channel is wrong for your market, you will hear it before you spend the money.", icon: "MessageSquareWarning" },
    { title: "Measure or do not claim", detail: "We do not report numbers we cannot trace to a source, and we will not put a metric on a case study we cannot evidence.", icon: "LineChart" },
    { title: "Leave people better equipped", detail: "Documentation, training and handover are part of delivery. Dependence on us is not a business model we want.", icon: "GraduationCap" },
    { title: "Build it to last", detail: "Standard tools, boring architecture, no proprietary lock-in. The best compliment is a platform still serving you in five years.", icon: "Boxes" },
  ],
  capabilities: [
    "Next.js and TypeScript application engineering",
    "Headless and platform e-commerce",
    "Technical, local and content-led SEO",
    "Paid search, paid social and server-side conversion tracking",
    "Brand identity and design systems",
    "Workflow automation and AI integration",
  ],
};

export const legalPages = {
  terms: {
    title: "Terms of Service",
    updated: "2026-08-01",
    intro:
      "These terms govern the use of the HYASCKA website and client platform. They are written to be read, not to be survived.",
    sections: [
      { heading: "Services", body: "We provide digital services described in a signed proposal or statement of work. Scope, deliverables, timeline and price are defined per engagement; nothing on this website constitutes an offer or a fixed quotation on its own." },
      { heading: "Accounts", body: "You are responsible for keeping your account credentials secure and for activity performed under your account. Notify us immediately if you believe an account has been compromised. We may suspend an account that is being used in breach of these terms, and we will tell you why." },
      { heading: "Payment", body: "Invoices are payable by the due date stated on the invoice. Manual payments are marked verified only after our finance team confirms the transaction. A confirmation screen in your browser is not proof of payment; verified status in your dashboard is." },
      { heading: "Intellectual property", body: "On full payment, ownership of custom deliverables produced for you transfers to you. Pre-existing HYASCKA components, tools and libraries remain ours and are licensed to you perpetually for use in the delivered work. Third-party licences remain governed by their own terms." },
      { heading: "Client responsibilities", body: "Timely feedback, access to systems and accurate information are required for us to deliver on schedule. Delays caused by these may shift agreed dates, and we will communicate the impact when it happens rather than after." },
      { heading: "Limitation of liability", body: "Our aggregate liability under an engagement is limited to the fees paid for that engagement. We are not liable for indirect or consequential loss. Nothing here limits liability that cannot lawfully be limited." },
      { heading: "Termination", body: "Either party may terminate an engagement with written notice as specified in the relevant agreement. On termination you receive all work completed and paid for, plus a handover of credentials and repositories." },
      { heading: "Changes", body: "We may update these terms. Material changes will be notified to account holders by email, and the effective date above will change." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: "2026-08-01",
    intro:
      "This policy explains what personal data HYASCKA collects, why, and what control you have over it.",
    sections: [
      { heading: "Data we collect", body: "Account data (name, email, phone, company and billing details), content you submit through forms or messages, transaction records for invoices and payments, and technical data such as IP address, browser type and pages visited." },
      { heading: "Why we collect it", body: "To provide the services you asked for, to operate your account, to process payments, to communicate about your projects, to keep the platform secure, and to meet legal and accounting obligations." },
      { heading: "Analytics and consent", body: "Analytics and advertising tools load only after you give consent through the cookie banner. Declining does not restrict any part of the site. Consent is stored in your browser and can be withdrawn at any time from the cookie settings link in the footer." },
      { heading: "Sharing", body: "We share data only with processors that operate the service — hosting, database, email delivery, payment processing and analytics — each under contract. We do not sell personal data and we never send payment credentials to any analytics system." },
      { heading: "Retention", body: "Account and financial records are retained for the period required by applicable accounting and tax law. Marketing contact data is retained until you unsubscribe or ask for deletion. Records under a legal hold are retained until it lifts." },
      { heading: "Your rights", body: "You may request access to, correction of, or deletion of your personal data, and you may object to processing. Email privacy@hyascka.com and we will respond within 30 days. Some financial records cannot be deleted while a legal retention obligation applies; we will say so explicitly if that is the case." },
      { heading: "Security", body: "Passwords are hashed, sessions use HttpOnly cookies over HTTPS, dashboard access denies by default, sensitive endpoints are rate limited, and access to sensitive records is logged in an audit trail." },
    ],
  },
  refund: {
    title: "Refund Policy",
    updated: "2026-08-01",
    intro:
      "How refunds work for project work and monthly retainers, in plain terms.",
    sections: [
      { heading: "Project work", body: "Project engagements are billed in milestones. If you cancel mid-project, you are billed for work completed and in progress up to the cancellation date; any balance held against unstarted milestones is refunded within 14 working days." },
      { heading: "Monthly retainers", body: "Retainers run month to month with 30 days' notice. The current month is not refundable once work has begun, because the capacity was reserved for you. Any month billed but not started is refunded in full." },
      { heading: "Deposits", body: "Project deposits reserve delivery capacity and are non-refundable once discovery has started. Before discovery begins, a deposit is fully refundable." },
      { heading: "How to request", body: "Open a request from your dashboard or email finance@hyascka.com with the invoice number. We respond within 3 working days and process approved refunds to the original payment method within 14 working days." },
      { heading: "Not covered", body: "Third-party costs already spent on your behalf — advertising spend, domain registrations, licences and gateway fees — cannot be refunded once incurred." },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    updated: "2026-08-01",
    intro:
      "Which cookies this site sets, what they do, and how to control them.",
    sections: [
      { heading: "Essential cookies", body: "Required for the site to function: your session when logged in, security and CSRF protection, and your saved theme and consent choices. These cannot be disabled, and they carry no advertising identifier." },
      { heading: "Analytics cookies", body: "Google Analytics 4 and Microsoft Clarity, used to understand how pages perform and where people get stuck. They load only with your consent." },
      { heading: "Marketing cookies", body: "Meta Pixel and Google Ads tags, used to measure campaign performance and show relevant ads. They load only with your consent." },
      { heading: "Managing consent", body: "Use the Cookie settings link in the footer to change your choices at any time. You can also clear cookies in your browser settings; the banner will then ask again on your next visit." },
    ],
  },
};
