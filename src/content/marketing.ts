import type {
  CaseStudySeed,
  FaqSeed,
  IndustrySeed,
  NavItemSeed,
  PostSeed,
  TeamSeed,
  TestimonialSeed,
} from "./types";

/**
 * Default marketing content. Everything here is editable from the dashboard
 * once a database is connected — these values are the starting state, and the
 * fallback the public site renders from before that (PRD §18, §47).
 *
 * NOTE FOR LAUNCH: replace the demonstration case studies, testimonials and
 * metrics with real, verifiable figures. PRD §7 is explicit — no fake claims.
 */

export const caseStudies: CaseStudySeed[] = [
  {
    slug: "b2b-saas-organic-growth",
    title: "Rebuilding a B2B SaaS site around search intent",
    client: "Northlane Systems",
    industry: "SaaS",
    summary:
      "A workflow-automation platform with strong product-market fit and almost no organic visibility. We rebuilt the site around the searches their buyers actually run.",
    challenge:
      "The site was a single-page marketing brochure. Every solution and integration lived behind a JavaScript tab, so nothing was indexable, and the sales team was buying every lead through paid search at a cost per acquisition that no longer worked.",
    solution:
      "We modelled the buying journey into 40 distinct intents, built a page template system so each one had a real, indexable page, and moved the whole site to statically generated Next.js with on-demand revalidation. Structured data, an internal linking architecture and a content programme followed.",
    outcome:
      "Organic became the largest source of qualified pipeline within nine months, and blended acquisition cost fell as paid spend was reallocated to the terms organic could not reach.",
    metrics: [
      { label: "Organic sessions", value: "+312%" },
      { label: "Qualified organic leads / month", value: "8 → 61" },
      { label: "Largest Contentful Paint", value: "4.1s → 0.9s" },
      { label: "Blended cost per lead", value: "-46%" },
    ],
    services: ["Web Development", "Search Engine Optimisation", "Technical SEO"],
    featured: true,
    position: 1,
  },
  {
    slug: "fashion-ecommerce-checkout",
    title: "A checkout rebuild that recovered abandoned revenue",
    client: "Maison Rouge",
    industry: "E-commerce",
    summary:
      "A fashion retailer losing three quarters of its mobile carts between the basket and the confirmation screen.",
    challenge:
      "Checkout ran across four steps, required account creation, and gave no delivery estimate until the final screen. On mobile, the payment step failed silently whenever a bank redirect timed out — customers assumed the order had gone through.",
    solution:
      "We rebuilt checkout as a single accountable step with guest purchase, saved addresses, delivery expectations shown from the basket onward, and a payment layer that reconciles server-side so a timed-out redirect recovers instead of dead-ending. bKash and Nagad were added alongside cards.",
    outcome:
      "Mobile conversion more than doubled, and support tickets about 'missing' orders effectively disappeared once payment state stopped depending on the browser.",
    metrics: [
      { label: "Mobile conversion rate", value: "0.8% → 2.1%" },
      { label: "Cart abandonment", value: "-34%" },
      { label: "Checkout load time", value: "-61%" },
      { label: "Payment support tickets", value: "-89%" },
    ],
    services: ["E-commerce Development", "Conversion Rate Optimisation"],
    featured: true,
    position: 2,
  },
  {
    slug: "clinic-local-visibility",
    title: "Winning the map pack across nine service areas",
    client: "Vireo Health Group",
    industry: "Healthcare",
    summary:
      "A multi-branch clinic invisible in local search outside the postcode of its head office.",
    challenge:
      "Nine branches shared one Google Business Profile, business details were inconsistent across dozens of directories, and the site had a single duplicated 'locations' page.",
    solution:
      "We separated and optimised a profile per branch, rebuilt location pages with genuinely distinct content and local schema, cleaned the citation footprint, and installed a review request workflow triggered at discharge.",
    outcome:
      "Branches began appearing in the map pack across their own catchment areas, and phone enquiries attributable to search grew steadily across the following two quarters.",
    metrics: [
      { label: "Map-pack keywords in top 3", value: "4 → 87" },
      { label: "Direction requests", value: "+218%" },
      { label: "Calls from search", value: "+164%" },
      { label: "Average branch rating", value: "3.9 → 4.7" },
    ],
    services: ["Local SEO", "Web Development"],
    featured: true,
    position: 3,
  },
  {
    slug: "logistics-operations-automation",
    title: "Cutting four hours a day out of dispatch admin",
    client: "Trailpoint Logistics",
    industry: "Logistics",
    summary:
      "A freight operator whose dispatch team spent half its day copying data between an order inbox, a spreadsheet and a driver app.",
    challenge:
      "Orders arrived by email in a dozen formats. Two coordinators re-keyed them into a spreadsheet, then again into the driver app. Errors were frequent and expensive, and nobody could answer 'where is this shipment' without a phone call.",
    solution:
      "We built an intake pipeline that parses incoming orders, extracts structured fields with a language model, and routes anything ambiguous to a human review queue rather than guessing. Confirmed orders sync automatically to dispatch, and a customer-facing status page removed the phone calls.",
    outcome:
      "Coordinator time on data entry dropped from roughly five hours a day to under one, with every automated decision logged and reversible.",
    metrics: [
      { label: "Daily admin hours", value: "5.2 → 0.8" },
      { label: "Order entry errors", value: "-93%" },
      { label: "Average intake time", value: "22min → 40s" },
      { label: "Status enquiry calls", value: "-71%" },
    ],
    services: ["AI & Business Automation", "Web Development"],
    featured: false,
    position: 4,
  },
];

export const industries: IndustrySeed[] = [
  {
    slug: "saas-technology",
    name: "SaaS & Technology",
    headline: "Pipeline that does not depend entirely on paid acquisition",
    description:
      "Software companies usually have the product and the case for it. What is missing is a site that ranks for the problems buyers search before they know your category exists, and a funnel measured end to end.",
    challenges: [
      "Growth locked to paid channels with rising acquisition cost",
      "Product-led messaging that never reaches problem-aware buyers",
      "Documentation and marketing site drifting apart",
      "Trials that start but never activate",
    ],
    solutions: [
      "Intent-mapped page architecture across the whole buying journey",
      "Technical SEO for JavaScript-heavy application marketing sites",
      "Server-side conversion tracking that matches your CRM",
      "Onboarding and activation flows instrumented and optimised",
    ],
    icon: "Cloud",
    position: 1,
  },
  {
    slug: "ecommerce-retail",
    name: "E-commerce & Retail",
    headline: "Fewer abandoned carts, faster catalogue, honest attribution",
    description:
      "Retail lives and dies on the path from product page to confirmation. We work on speed, checkout friction and the local payment methods your customers actually use.",
    challenges: [
      "Mobile checkout abandonment",
      "Catalogue pages that slow down as the range grows",
      "Payment failures that look like completed orders",
      "Ad platforms and analytics reporting different numbers",
    ],
    solutions: [
      "Statically generated catalogue with on-demand revalidation",
      "Single-step checkout with guest purchase and recovery states",
      "bKash, Nagad, bank transfer and card gateways reconciled server-side",
      "Server-side conversion events for accurate campaign optimisation",
    ],
    icon: "ShoppingBag",
    position: 2,
  },
  {
    slug: "healthcare-clinics",
    name: "Healthcare & Clinics",
    headline: "Found locally, trusted immediately, booked easily",
    description:
      "Patients search close to home and decide fast. Local visibility, credible content and a booking path that works on a phone matter more than anything else.",
    challenges: [
      "Invisible in local search outside the head-office postcode",
      "Inconsistent business information across directories",
      "Content that must be accurate and appropriately cautious",
      "Booking journeys that break on mobile",
    ],
    solutions: [
      "Per-branch profile optimisation and grid rank tracking",
      "Distinct, genuinely useful location pages with local schema",
      "Review generation built into the patient journey",
      "Accessible, fast booking flows meeting WCAG 2.1 AA",
    ],
    icon: "HeartPulse",
    position: 3,
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    headline: "Authority that converts before the first conversation",
    description:
      "Law, accountancy and consultancy buyers self-educate for weeks before making contact. The firm that answers their questions best is usually the one they call.",
    challenges: [
      "Undifferentiated positioning in a crowded market",
      "Expertise trapped in partners' heads rather than published",
      "Long consideration cycles that are hard to attribute",
      "Enquiry forms that leak qualified leads",
    ],
    solutions: [
      "Positioning and messaging built on real differentiation",
      "Publishing systems that make expert output repeatable",
      "Multi-touch attribution across a long consideration window",
      "Enquiry flows with routing, SLA tracking and follow-up automation",
    ],
    icon: "Scale",
    position: 4,
  },
  {
    slug: "education",
    name: "Education & Training",
    headline: "From course discovery to completed enrolment",
    description:
      "Education marketing is seasonal, competitive and enrolment-driven. The site has to work hardest in the weeks that decide the year.",
    challenges: [
      "Sharp seasonal traffic peaks that break slow sites",
      "Course catalogues that are hard to search and compare",
      "Enrolment forms abandoned mid-way",
      "Prospective students and parents needing different information",
    ],
    solutions: [
      "Static generation and edge caching that hold up under peak load",
      "Filterable, comparable course catalogues",
      "Multi-step enrolment with save-and-resume",
      "Segmented journeys for each audience",
    ],
    icon: "GraduationCap",
    position: 5,
  },
  {
    slug: "real-estate",
    name: "Real Estate & Property",
    headline: "Listings that load instantly and enquiries that reach an agent",
    description:
      "Property buyers browse dozens of listings on a phone. Speed, image quality and a working enquiry path decide who gets the call.",
    challenges: [
      "Image-heavy listing pages that are slow on mobile data",
      "Listing data spread across multiple systems",
      "Enquiries that sit unanswered while a buyer contacts someone else",
      "Weak visibility for area and neighbourhood searches",
    ],
    solutions: [
      "Responsive, modern-format imagery with strict performance budgets",
      "Listing feeds synchronised into a single source of truth",
      "Instant enquiry routing with response-time tracking",
      "Area landing pages built for local search intent",
    ],
    icon: "Building2",
    position: 6,
  },
];

export const testimonials: TestimonialSeed[] = [
  {
    author: "Farhana Rahman",
    role: "Head of Marketing",
    company: "Northlane Systems",
    quote:
      "They started by asking what a lead is actually worth to us, and every decision after that traced back to it. The first month was almost entirely unglamorous technical fixes — and that is exactly why the content that followed worked.",
    rating: 5,
    position: 1,
  },
  {
    author: "Imran Chowdhury",
    role: "Founder",
    company: "Maison Rouge",
    quote:
      "Our checkout was losing money in a way nobody could see. HYASCKA found it in the session recordings within a week, and the rebuild paid for itself in the first quarter.",
    rating: 5,
    position: 2,
  },
  {
    author: "Dr. Nusrat Jahan",
    role: "Operations Director",
    company: "Vireo Health Group",
    quote:
      "Nine branches, nine sets of business data, and none of it consistent. They untangled all of it and then handed us a review process our clinic managers actually follow.",
    rating: 5,
    position: 3,
  },
  {
    author: "Tanvir Alam",
    role: "Chief Operating Officer",
    company: "Trailpoint Logistics",
    quote:
      "I was sceptical about anything with 'AI' attached to it. What we got was a queue where anything uncertain goes to a person, and a log of every automated decision. That is the version I trust.",
    rating: 5,
    position: 4,
  },
  {
    author: "Sadia Karim",
    role: "Brand Director",
    company: "Aurora Collective",
    quote:
      "The design system is the part I did not know to ask for. Six months on, our own team is still producing on-brand work without going back to a designer for every asset.",
    rating: 5,
    position: 5,
  },
  {
    author: "Rakib Hasan",
    role: "Managing Partner",
    company: "Meridian Advisory",
    quote:
      "Straight answers, including when the answer was that our budget was too small to learn anything from. That honesty is why we increased it and stayed.",
    rating: 5,
    position: 6,
  },
];

export const faqs: FaqSeed[] = [
  {
    question: "How do projects usually start?",
    answer: "With a 30-minute call, then a short paid discovery for anything beyond a small build. Discovery produces the sitemap, content model, performance budget and success metrics in writing before a line of code is written. It is the cheapest possible way to avoid an expensive misunderstanding, and it is yours to keep whether or not you continue with us.",
    category: "Working with us",
    position: 1,
  },
  {
    question: "Do we own the code and the accounts?",
    answer: "Yes, without exception. The repository, database, ad accounts, analytics properties and every credential are created in your name from day one. If we stop working together you keep everything, and we run a handover session rather than simply switching off.",
    category: "Working with us",
    position: 2,
  },
  {
    question: "Who actually does the work?",
    answer: "The people you meet on the first call. We are deliberately small — there is no account layer between you and the engineer, strategist or designer delivering your project. You get named contacts and direct access to them.",
    category: "Working with us",
    position: 3,
  },
  {
    question: "How do you communicate during a project?",
    answer: "A live staging URL from week one, a weekly demo, and a shared client portal with projects, milestones, files, invoices and messages in one place. You never have to ask where something stands — it is on screen.",
    category: "Working with us",
    position: 4,
  },
  {
    question: "What if we already have an in-house team?",
    answer: "That is common and usually the best outcome. We hand over ticket-ready specifications with reproductions, fixes and acceptance criteria, and we can pair with your developers rather than replacing them. Several of our engagements are purely advisory.",
    category: "Working with us",
    position: 5,
  },
  {
    question: "Do you work with clients outside Bangladesh?",
    answer: "Yes. We work with clients across Asia, Europe and North America and invoice in USD, EUR, GBP or BDT. Delivery runs asynchronously with a scheduled overlap window agreed at kickoff.",
    category: "Working with us",
    position: 6,
  },
  {
    question: "Can our team edit the site without a developer?",
    answer: "That is a build requirement, not an add-on. Homepage sections, services, pricing, blog, case studies, testimonials, FAQs, navigation, SEO metadata and the theme are all editable from your dashboard through structured forms, with preview before publishing.",
    category: "Working with us",
    position: 7,
  },
  {
    question: "What happens if we need to pause a project?",
    answer: "Tell us as early as you can. Work stops at the end of the current milestone, you are billed only for what is complete, and your staging environment and repository stay available. Restarting is a scheduling conversation, not a new project.",
    category: "Working with us",
    position: 8,
  },
  {
    question: "How do you handle scope changes mid-project?",
    answer: "Small changes inside the agreed shape are absorbed. Anything that moves the scope gets a written change note with its cost and timeline impact before we start it — no surprise line items at the end.",
    category: "Working with us",
    position: 9,
  },
  {
    question: "What happens after launch?",
    answer: "Thirty days of support are included with every build, covering bugs and small changes. Most clients then move to a monthly retainer for iteration and growth work, but there is no obligation — the site is fully yours to run.",
    category: "Working with us",
    position: 10,
  },
  {
    question: "What does a project cost?",
    answer: "Marketing sites start at $1,500, e-commerce builds at $2,400, and retainers from $220 per month. Every service page lists its own starting price and pricing model, and after a discovery call you receive a fixed proposal with scope, deliverables and timeline — never an hourly estimate that drifts.",
    category: "Pricing & delivery",
    position: 11,
  },
  {
    question: "How are payments and invoices handled?",
    answer: "Through your client portal. Invoices appear in your dashboard and you can pay by bKash, Nagad, bank transfer or card gateway — whichever methods are active. Manual payments are submitted with a transaction ID and verified by our finance team, and every step is visible to you.",
    category: "Pricing & delivery",
    position: 12,
  },
  {
    question: "How long does a typical build take?",
    answer: "Four to ten weeks for a marketing site, six to twelve for e-commerce, depending on scope and how quickly content and feedback arrive. Retainer work starts within two weeks of signing. Every proposal carries a milestone schedule with dates.",
    category: "Pricing & delivery",
    position: 13,
  },
  {
    question: "What are your performance targets?",
    answer: "Lighthouse 95 or better on mobile and desktop for key public pages, Core Web Vitals in the green on real-device field data, and WCAG 2.1 AA accessibility. These are written into the acceptance criteria of every build and verified in the deployment pipeline, not measured afterwards.",
    category: "Pricing & delivery",
    position: 14,
  },
  {
    question: "Do you guarantee first-page rankings?",
    answer: "No, and we would be cautious of anyone who does — search engines do not sell that guarantee to anybody. We commit to the work, the reporting and the leading indicators, and we set realistic expectations per keyword group in the first month.",
    category: "Pricing & delivery",
    position: 15,
  },
  {
    question: "How is our data protected?",
    answer: "Every dashboard route and API endpoint denies by default and re-checks permissions server-side on every request. Passwords are hashed, sessions use HttpOnly cookies and can be revoked by you, sensitive endpoints are rate limited, and every financial or security-relevant action is written to an audit log.",
    category: "Pricing & delivery",
    position: 16,
  },
  {
    question: "What hosting and infrastructure do you use?",
    answer: "Vercel for hosting, Neon for PostgreSQL, Cloudflare for DNS and CDN, Cloudinary for media. Everything starts on a free tier and scales by changing an environment variable, so early-stage costs stay near zero without a rewrite later.",
    category: "Pricing & delivery",
    position: 17,
  },
  {
    question: "Can you take over a site someone else built?",
    answer: "Often, yes. We start with a technical audit that tells you honestly whether the existing codebase is worth continuing or whether a rebuild is cheaper over eighteen months. You get that recommendation in writing even if the answer is inconvenient for us.",
    category: "Pricing & delivery",
    position: 18,
  },
  {
    question: "What kind of reporting do we receive?",
    answer: "A monthly report tied to the metric the engagement was set up to move — qualified leads, revenue, conversion rate — not a wall of impressions. You can also generate daily, weekly or monthly reports yourself from the dashboard and export them as PDF or Excel.",
    category: "Pricing & delivery",
    position: 19,
  },
  {
    question: "What if something breaks at 2am?",
    answer: "Uptime monitoring alerts us before most clients notice. Critical errors route to a real-time channel rather than a dashboard nobody watches. Retainer clients get a defined response window written into their agreement; build clients get thirty days of the same during the support period.",
    category: "Pricing & delivery",
    position: 20,
  },
];

export const posts: PostSeed[] = [
  {
    slug: "core-web-vitals-that-actually-move",
    coverImage: "/blog/core-web-vitals-that-actually-move.svg",
    title: "The three Core Web Vitals fixes that actually move the needle",
    excerpt:
      "Most performance advice is a list of forty things. In practice, three changes account for the majority of the gain on a typical marketing site.",
    categorySlug: "performance",
    categoryName: "Performance",
    tags: ["performance", "core-web-vitals", "nextjs"],
    readMinutes: 7,
    publishedAt: "2026-07-14",
    content: `Every performance audit produces a long list. Most of that list is worth doing eventually. But if you only have one sprint, three changes usually account for most of the improvement.

## 1. Stop the hero image being discovered late

Largest Contentful Paint is nearly always a hero image or a heading blocked by a webfont. If the image is discovered only after JavaScript has parsed, you have already lost a second.

Serve it as a real \`<img>\` in the initial HTML with \`fetchpriority="high"\`, give it explicit dimensions so nothing shifts, and make sure it is not lazy-loaded. A lazy-loaded hero is the single most common self-inflicted LCP problem.

## 2. Ship less JavaScript to the pages that need it least

A marketing homepage rarely needs a client-side router, a state library and a carousel. Server Components let you keep the page as HTML and hydrate only the parts that are genuinely interactive.

The measurement that matters is not bundle size on your laptop — it is main-thread blocking time on a mid-range Android device on a 4G connection. Test there.

## 3. Reserve space for anything that arrives late

Cumulative Layout Shift is almost always ads, embeds, or a font swap moving text. Reserve the box before the content arrives: explicit width and height on media, a minimum height on embed containers, and \`size-adjust\` on font fallbacks so the swap does not reflow the paragraph.

## What we do not recommend

Chasing a synthetic Lighthouse score with tricks that do not help real users — deferring everything until interaction, or hiding content behind a fake loading state. Field data from real users is the only score worth optimising.`,
  },
  {
    slug: "server-actions-are-public-endpoints",
    coverImage: "/blog/server-actions-are-public-endpoints.svg",
    title: "Your Server Actions are public endpoints — treat them that way",
    excerpt:
      "A Server Action is reachable by anyone who can craft an HTTP request. The UI that normally calls it is not a security boundary.",
    categorySlug: "security",
    categoryName: "Security",
    tags: ["security", "nextjs", "server-actions"],
    readMinutes: 6,
    publishedAt: "2026-06-28",
    content: `The most common security mistake we find in Next.js applications is treating a Server Action as an internal function. It is not. It compiles down to an addressable endpoint, and anyone can call it with arguments of their choosing, without ever loading the page that normally triggers it.

## The failure mode

An action takes an \`invoiceId\` and marks it paid. The button that calls it only renders for finance staff, so it feels safe. But the action itself never checks who is calling. A client account can call it directly with any invoice id and mark their own invoice paid.

The UI hid the button. It did not protect the operation.

## The rule

Every action starts the same way, without exception:

1. **Authenticate.** Resolve the session server-side. No session, no further execution.
2. **Authorise.** Check the specific permission this operation requires, against the database — never against a value the caller supplied.
3. **Validate.** Parse every argument with a schema before anything touches the database.
4. **Check ownership.** An id in the arguments proves nothing. Load the record and confirm this user may act on it.
5. **Audit.** Write who did what, to which record, and when.

## Keep the logic in one place

If those five steps live inside each action, one of forty actions will eventually miss a step. Put the business logic in a domain module that performs the checks, and let both actions and API routes call into it. One place to audit, one place to fix.

That is exactly how the HYASCKA platform is structured, and it is the first thing we look for when reviewing someone else's.`,
  },
  {
    slug: "why-your-ad-conversions-disappeared",
    coverImage: "/blog/why-your-ad-conversions-disappeared.svg",
    title: "Why your ad platform conversions no longer match your CRM",
    excerpt:
      "Browser-side tracking loses a meaningful share of conversions. Server-side events close most of the gap — here is what that actually involves.",
    categorySlug: "marketing",
    categoryName: "Marketing",
    tags: ["analytics", "meta-capi", "tracking"],
    readMinutes: 8,
    publishedAt: "2026-06-09",
    content: `If your CRM shows 100 leads and Meta shows 61, nothing is broken. That gap is the normal cost of browser-only tracking: ad blockers, tracking prevention, consent declines and users who close the tab before the pixel fires.

The gap matters more than the reporting inaccuracy suggests, because the ad platform optimises on what it can see. Missing 40% of conversions means bidding on a distorted picture.

## Server-side conversions

The fix is to send the conversion from your server, where the transaction actually completed. Meta's Conversions API and GA4's Measurement Protocol both accept this.

The important details:

- **Deduplicate.** Send the same event id from both the browser and the server so a conversion counted twice does not inflate your numbers.
- **Hash the identifiers.** Email and phone are hashed before they leave your server. Never send raw personal data, and never send anything payment-related.
- **Keep the token server-side.** A CAPI access token in client-side code is a leaked credential. It belongs in an environment variable, used only in server code.
- **Respect consent.** Server-side is not a consent workaround. If a user declined, the event does not go — regardless of which side of the connection it would have left from.

## What to expect

Recovering most of the missing conversions is realistic. Perfect parity with your CRM is not, and a vendor promising it is measuring something else. What you should see is bidding that improves because the platform is finally optimising against something close to reality.`,
  },
  {
    slug: "cms-that-your-team-will-actually-use",
    coverImage: "/blog/cms-that-your-team-will-actually-use.svg",
    title: "Building a CMS your marketing team will actually use",
    excerpt:
      "Content editors do not abandon a CMS because it lacks features. They abandon it because they are afraid of breaking something.",
    categorySlug: "product",
    categoryName: "Product",
    tags: ["cms", "ux", "content"],
    readMinutes: 5,
    publishedAt: "2026-05-21",
    content: `We have seen expensive content platforms sit unused while the marketing team emails changes to a developer. The features were all there. The confidence was not.

## Fear is the real blocker

An editor who is not certain what a field does will not touch it. Give them a rich text box that accepts raw HTML and they will avoid the page entirely rather than risk breaking the layout.

The fix is constraint, not capability:

- **Structured fields, not free-form code.** A headline field, a body field, a list of feature cards. Not an HTML editor.
- **Preview before publish.** Every change viewable in context before it goes live.
- **Safe options only.** Theme is a choice between two accents, buttons are a set of defined variants. There is no field where someone can paste CSS.
- **Undo.** Change history with rollback turns "I might break it" into "I can fix it".
- **Explain the jargon inline.** A one-line tooltip next to "slug" and "meta description" removes most support questions.

## The measure of success

Not how many features shipped. Whether the marketing team changed the homepage last week without asking anyone. If a developer is still in that loop, the CMS has not done its job.`,
  },
  {
    slug: "choosing-payment-methods-bangladesh",
    coverImage: "/blog/choosing-payment-methods-bangladesh.svg",
    title: "Choosing payment methods for a Bangladeshi customer base",
    excerpt:
      "Card-only checkout excludes a large share of buyers. Here is how mobile wallets, bank transfer and gateways compare in practice.",
    categorySlug: "ecommerce",
    categoryName: "E-commerce",
    tags: ["payments", "bkash", "ecommerce"],
    readMinutes: 6,
    publishedAt: "2026-05-02",
    content: `A checkout that only accepts cards will lose a substantial share of Bangladeshi customers at the final step. Here is the practical trade-off between the options.

## Mobile wallets (bKash, Nagad)

Highest reach and instantly familiar. Two routes exist: a manual flow where the customer sends money and submits the transaction id, and a merchant API integration.

Manual costs nothing to start and works from day one, but it needs a human to verify each payment. That is entirely workable at moderate volume — provided the transaction id is enforced as unique so the same reference cannot be reused across invoices, which is exactly the kind of check that gets forgotten.

## Bank transfer

Preferred for larger B2B invoices. Slowest to reconcile, and worth automating with a statement import once volume justifies it.

## Card gateways (SSLCommerz and similar)

Best experience when it works, at a transaction fee and after a merchant onboarding process. The non-negotiable rule: never trust the browser's success screen. Confirm the payment from the signed webhook, process it idempotently, and reconcile server-side. A redirect that times out must not leave a paid order looking unpaid — or an unpaid one looking settled.

## What we recommend

Start with manual mobile wallet plus bank transfer, add a gateway once volume makes the fee worth the convenience. Build the payment layer so each method is a toggle in the dashboard, and adding one never requires a deployment.`,
  },
  {
    slug: "what-a-realistic-seo-timeline-looks-like",
    coverImage: "/blog/what-a-realistic-seo-timeline-looks-like.svg",
    title: "What a realistic SEO timeline actually looks like",
    excerpt:
      "Month one rarely produces traffic. Understanding what it should produce instead is how you avoid cancelling the work right before it pays.",
    categorySlug: "seo",
    categoryName: "SEO",
    tags: ["seo", "strategy", "reporting"],
    readMinutes: 7,
    publishedAt: "2026-04-18",
    content: `The most common reason SEO fails is that it gets cancelled in month three — right before the curve turns. Setting the expectation correctly at the start is part of the work.

## Month 1 — nothing visible, and that is correct

Crawl, log-file analysis, competitor gap, intent mapping and the technical fix list. Output is a plan and a set of tickets, not traffic. Any agency showing you a traffic increase in month one is showing you seasonality.

## Months 2–3 — technical gains

Fixed indexation and speed issues can move existing pages quickly, because the pages already have authority; they were simply being under-served. This is often the first visible movement.

## Months 4–6 — content compounds

Pages published in month two start ranking. Long-tail terms arrive first. The leading indicator to watch is impressions in Search Console, which rise well before clicks do.

## Months 7–12 — commercial terms

The high-intent, high-competition terms need authority, which needs time and links. This is where the revenue is, and where most people have already given up.

## What to hold us to in the meantime

Indexation coverage, average position on the target set, impression growth, and the conversion rate of organic sessions. Those tell you whether it is working long before the revenue line does.`,
  },
  {
    slug: "the-brief-that-gets-a-good-proposal",
    title: "The brief that gets you a good proposal",
    excerpt:
      "Agencies quote badly when they are guessing. Six things in your brief remove most of the guessing — and usually the padding with it.",
    categorySlug: "strategy",
    categoryName: "Strategy",
    tags: ["proposals", "process"],
    readMinutes: 6,
    publishedAt: "2026-08-02",
    coverImage: "/blog/the-brief-that-gets-a-good-proposal.svg",
    content: `Every agency has a padding number. It is the amount added to a quote to cover what the brief did not say. The less a brief leaves open, the smaller that number gets.

Here is what actually removes the guesswork.

## 1. The decision behind the project

Not "we need a new website". Why now? A funding round, a rebrand, a product launch, a competitor who overtook you. The reason sets the deadline and tells us what cannot slip.

## 2. What the site has to do

Pick one primary action. Book a call, start a trial, submit an enquiry, buy. A site optimised for two primary actions is optimised for neither.

!! If you cannot name the single action, the design cannot prioritise it either — and neither can the copy, the navigation or the analytics.

## 3. What you already have

- Brand assets, or the absence of them
- Copy, or who will write it
- Photography, or a budget for it
- An existing CMS you must keep

Missing copy is the single most common cause of a late launch. It is rarely the design.

## 4. Who signs it off

One name. Two is workable. Five means the project will take twice as long, and any honest agency will price for that.

## 5. Constraints you already know

Hosting you must stay on, a payment gateway you must use, an accessibility standard you must meet, a market that needs a second language. These change the estimate, so they should arrive before it, not after.

## 6. A number

A range is enough. Without one, an agency guesses which version of the project you want, and half the proposals you receive will be answering a different question.

## What a good proposal gives back

1. Scope, in outcomes rather than deliverables
2. What is explicitly not included
3. A timeline with your dependencies marked
4. A fixed price, or a clearly bounded range
5. What happens when something changes

If you get a proposal without the fourth and fifth items, ask for them. The answer tells you a lot about how the project will run.`,
  },
  {
    slug: "why-fast-sites-convert",
    title: "Why a fast site converts better, and what fast actually means",
    excerpt:
      "Speed is not a vanity metric. Here is the mechanism by which it turns into revenue, and the three numbers worth watching.",
    categorySlug: "performance",
    categoryName: "Performance",
    tags: ["performance", "conversion"],
    readMinutes: 7,
    publishedAt: "2026-08-04",
    coverImage: "/blog/why-fast-sites-convert.svg",
    content: `Fast sites convert better" is repeated so often that it has stopped meaning anything. It is true, but the mechanism matters, because it tells you what to fix.

## The mechanism

A visitor arrives with a question. Every second before they can start answering it is a second in which leaving costs them nothing. Slowness does not annoy people into leaving; it removes the reason to stay.

This is why the metric that matters is not "page load". It is the time until the visitor can read the thing they came for.

## The three numbers

### Largest Contentful Paint

When the main content appears. Under 2.5 seconds on a mid-range phone on a real network. Nearly always a hero image or a heading held up by a font.

### Interaction to Next Paint

How long the page takes to respond when tapped. Under 200 milliseconds. Usually a hydration problem: too much JavaScript waking up at once.

### Cumulative Layout Shift

How much the page moves while loading. Under 0.1. Ads, images without dimensions, and banners that appear after the fact.

!! Measure on a throttled mid-range phone, not your laptop. Your laptop is not your customer.

## What we do about it

1. Server-render the content, so reading does not wait for JavaScript
2. Ship interactive code only where something is genuinely interactive
3. Give every image explicit dimensions
4. Load fonts so that text is readable immediately
5. Put a performance budget in the deployment pipeline, so a regression fails the build rather than being discovered a quarter later

The last one is the one most teams skip, and it is the reason sites get slower after launch. A number nobody enforces is a number that drifts.`,
  },
  {
    slug: "analytics-you-can-defend",
    title: "Analytics you can defend in a board meeting",
    excerpt:
      "Sessions and bounce rate do not survive a finance director's follow-up question. Here is the smaller set of numbers that does.",
    categorySlug: "analytics",
    categoryName: "Analytics",
    tags: ["analytics", "reporting"],
    readMinutes: 6,
    publishedAt: "2026-08-06",
    coverImage: "/blog/analytics-you-can-defend.svg",
    content: `A marketing report full of sessions, pageviews and bounce rate survives until someone asks what it earned. Then it does not.

## Start from the money

Work backwards from revenue:

1. Revenue
2. Closed deals
3. Qualified opportunities
4. Enquiries
5. Sessions

Most reporting starts at 5 and stops. The useful reporting starts at 1 and only mentions 5 as context.

## Three numbers per channel

### Cost per qualified enquiry

Not per lead. A lead your sales team rejects is a cost, not a result.

### Pipeline created

The value of opportunities the channel produced this period, regardless of whether they closed yet.

### Closed revenue with the lag stated

Say the lag. "Revenue from enquiries raised 90 days ago" is honest; "revenue this month" implies a speed that rarely exists in B2B.

!! If a channel report cannot say what a qualified enquiry costs, it is not a report — it is a description of traffic.

## Make the CRM the source of truth

Analytics tools know about sessions. Your CRM knows about money. Joining them is the whole job:

- Pass a stable identifier from the form into the CRM
- Store the first and last touch against the record
- Report from the CRM, using analytics for the behavioural detail

## The conversation this enables

When a channel underperforms, you are no longer arguing about attribution models. You are looking at cost per qualified enquiry by channel, and the decision makes itself.`,
  },
  {
    slug: "accessibility-is-not-a-checklist",
    title: "Accessibility is not a checklist you run at the end",
    excerpt:
      "Most accessibility failures are decisions made months before anyone ran a scanner. Here are the ones that cost the most to reverse.",
    categorySlug: "engineering",
    categoryName: "Engineering",
    tags: ["accessibility", "engineering"],
    readMinutes: 7,
    publishedAt: "2026-08-08",
    coverImage: "/blog/accessibility-is-not-a-checklist.svg",
    content: `Automated tools catch perhaps a third of accessibility problems. The rest are design and architecture decisions, and by the time a scanner runs, they are expensive to undo.

## The decisions that matter

### Colour, chosen before anything is built

Contrast is set the moment a palette is approved. A brand colour that fails against white will fail on every button, badge and link on every page. Fix it in the palette, not per component.

### Focus, designed rather than removed

Someone always removes the focus ring because it looks untidy. Design one that does not, and keep it visible against every background you ship.

### Headings that describe the page

A heading order is a table of contents. Skipping from h1 to h4 because it looked right is the most common failure we find, and it makes a page unusable with a screen reader.

### Names that match what is on screen

If a button reads "Get a quote", its accessible name must contain "Get a quote". Voice control users say what they see.

!! Every one of the above is free while a design is in Figma, and expensive once it is in code across forty templates.

## What to actually do

1. Check the palette for contrast before the design is signed off
2. Build one focus style into the design system
3. Review heading order per template, once
4. Test with a keyboard only, for ten minutes, every sprint
5. Run the automated scanner in CI so regressions fail the build

The ten minutes of keyboard testing finds more than the scanner. Nothing about it requires a specialist.`,
  },
  {
    slug: "choosing-a-cms-in-2026",
    title: "Choosing a CMS when everyone on the shortlist demos well",
    excerpt:
      "Every CMS looks good in a demo. Four questions separate the ones your team will still be using in two years.",
    categorySlug: "strategy",
    categoryName: "Strategy",
    tags: ["cms", "strategy"],
    readMinutes: 6,
    publishedAt: "2026-08-10",
    coverImage: "/blog/choosing-a-cms-in-2026.svg",
    content: `A CMS demo is a controlled environment. The content is prepared, the editor is the person who built it, and nothing is on deadline. Here is what to ask instead.

## 1. Who is going to use this on a Friday afternoon?

Not the developer. The person publishing a case study at 4pm with a client waiting. Sit them in front of it and give them a real task.

## 2. What happens when the content model is wrong?

It will be. A field will be missing, a section will need reordering, something will need to become a list. Ask how long that change takes and who has to do it.

## 3. What does it cost at three times the volume?

Per-seat pricing, per-record pricing and bandwidth pricing all behave differently as you grow. Model it at 3x, not at today.

## 4. What happens if you leave?

Can you export the content, with its structure intact, without writing custom code? If the answer is vague, that is the answer.

!! The best CMS is the one your editors do not need to ask a developer about. Nothing else on the shortlist matters as much.

## What we build towards

- Structured fields rather than a single rich-text blob
- A preview that shows the real page
- Publishing that is one action, not a deploy
- Archive rather than delete, so a mistake is recoverable
- Guidance next to each field, in the words your team uses

That last one sounds small. It is the difference between a CMS that gets used and one that gets worked around.`,
  },
  {
    slug: "landing-pages-that-earn-the-click",
    title: "Landing pages that earn the click they paid for",
    excerpt:
      "If the ad promises one thing and the page delivers another, the budget pays for the mismatch. A structure that does not do that.",
    categorySlug: "growth",
    categoryName: "Growth",
    tags: ["paid-media", "conversion"],
    readMinutes: 5,
    publishedAt: "2026-08-12",
    coverImage: "/blog/landing-pages-that-earn-the-click.svg",
    content: `The most expensive part of paid media is not the click. It is the click that lands somewhere that does not continue the sentence the ad started.

## Continue the sentence

If the ad says "fixed-price Shopify migrations", the page headline should say something close to it. Not a brand statement, not a value proposition — the same promise, in the same words.

## The structure that works

1. The promise from the ad, restated
2. Proof that it is true — a number, a client, a screenshot
3. What is included, in plain terms
4. What it costs, or the range
5. One action, repeated

### On the proof

Specific beats impressive. "Cut checkout abandonment by 23% for a fashion retailer" is worth more than "trusted by industry leaders", because the first can be checked.

!! One action. A page offering a demo, a download and a newsletter converts on none of them.

## What to remove

- The main site navigation, which is an exit
- The second call to action
- Anything the visitor has to decide before they can decide the main thing

## Measure the thing that matters

Not the form submission. The qualified enquiry. A page that doubles submissions and halves quality has cost you money, and only the CRM will tell you.`,
  },
  {
    slug: "technical-seo-that-is-worth-the-time",
    title: "The technical SEO work that is worth the time",
    excerpt:
      "Most technical SEO audits are 200 rows long. Perhaps fifteen of them affect anything. Here is how to tell which.",
    categorySlug: "seo",
    categoryName: "SEO",
    tags: ["seo", "technical"],
    readMinutes: 7,
    publishedAt: "2026-08-14",
    coverImage: "/blog/technical-seo-that-is-worth-the-time.svg",
    content: `A technical audit will hand you two hundred issues. Fixing all of them is a quarter of engineering time. Most of it changes nothing.

## Sort by whether it blocks

### Blocking: the page cannot be found or indexed

- Robots rules excluding pages you want ranked
- Noindex left on after a staging deploy
- Canonicals pointing at the wrong URL
- Pagination that hides the majority of a catalogue

These are worth dropping other work for. Everything below is optimisation.

### Serious: the page is found but competes badly

- Slow Core Web Vitals on templates that matter
- Duplicate titles and descriptions across a template
- Internal linking that leaves important pages three clicks deep
- Missing structured data on pages eligible for a rich result

### Cosmetic: worth doing, not worth a sprint

Most of the rest of the list.

!! If a finding cannot be traced to a page you want ranked, it is not a priority — it is inventory.

## The order we work in

1. Fix anything that blocks indexing
2. Fix the templates that carry commercial pages
3. Improve internal linking to those pages
4. Add structured data where a rich result exists
5. Then work the long tail

## What to expect

Indexing fixes can show up in days. Template and speed work takes weeks to be reflected. Anything to do with authority takes months. An agency promising otherwise is selling the timeline, not the work.`,
  },
  {
    slug: "what-a-design-system-is-for",
    title: "What a design system is actually for",
    excerpt:
      "Not consistency for its own sake. A design system exists to make the next page cheaper than the last one.",
    categorySlug: "design",
    categoryName: "Design",
    tags: ["design", "systems"],
    readMinutes: 6,
    publishedAt: "2026-08-16",
    coverImage: "/blog/what-a-design-system-is-for.svg",
    content: `Design systems get justified with the word consistency, which makes them sound like tidiness. The real argument is cost.

## The economics

Without a system, page eleven costs about what page one cost. With one, page eleven costs a fraction, because the decisions have already been made and the components already exist.

That is the whole case. Consistency is a side effect.

## What earns its place

### Tokens, before components

Colour, type scale, spacing, radius, motion. If these live in one place, a rebrand is a file. If they live in components, it is a project.

### Components that encode decisions

A button component that only allows the variants you actually use is more valuable than one that accepts arbitrary styling. The constraint is the feature.

### Documentation in the same repository

Documentation that lives somewhere else is documentation that goes stale.

!! A design system nobody can find is a folder of components. The findability is part of the system.

## What does not

- Components built before there is a second use for them
- Variants added because they might be needed
- A component library that mirrors a design tool one-to-one

## How to start

Take the three templates you build most often. Extract only what all three need. Ship that. Add the fourth thing when a fourth page asks for it, not before.`,
  },
  {
    slug: "moving-off-a-page-builder",
    title: "Moving off a page builder without losing your rankings",
    excerpt:
      "Replatforming is where organic traffic goes to die. It does not have to. The checklist that protects it.",
    categorySlug: "engineering",
    categoryName: "Engineering",
    tags: ["migration", "seo"],
    readMinutes: 8,
    publishedAt: "2026-08-18",
    coverImage: "/blog/moving-off-a-page-builder.svg",
    content: `Most traffic lost in a replatform is lost to details that are cheap to get right and expensive to fix afterwards.

## Before you build anything

### Inventory what exists

Crawl the current site. Export every URL with its traffic, its rankings and its inbound links. This list is the specification for the migration.

### Decide the URL of every page

Keep them if you can. Every changed URL costs a redirect, and every redirect costs a little authority.

## During the build

1. Map old URL to new URL for every page in the inventory, with no gaps
2. Carry titles, descriptions and headings across deliberately, not by copy-paste
3. Keep structured data on the templates that had it
4. Rebuild internal links to point at final URLs, not through redirects

!! A redirect chain is a link that works but loses value at every hop. Point old directly at new, once.

## Launch day

- Deploy redirects with the site, not after it
- Submit the new sitemap
- Keep the old sitemap available briefly so crawlers find the redirects
- Watch server logs, not just analytics — crawlers show up in logs first

## The two weeks after

Traffic usually dips. A dip that recovers within a few weeks is normal. A dip that does not is a redirect problem, and the logs will show which URLs are being crawled and what they return.

The teams that come through a replatform without damage are not the ones with the best new site. They are the ones who treated the URL map as a deliverable.`,
  },
  {
    slug: "pricing-work-honestly",
    title: "Pricing digital work honestly",
    excerpt:
      "Hourly billing rewards slowness and punishes expertise. Fixed scope is harder to write and better for everyone. How we do it.",
    categorySlug: "business",
    categoryName: "Business",
    tags: ["pricing", "process"],
    readMinutes: 6,
    publishedAt: "2026-08-20",
    coverImage: "/blog/pricing-work-honestly.svg",
    content: `An hourly estimate is a prediction dressed as a price. It moves, and the client absorbs the movement.

## Why we quote fixed scope

Because the risk should sit with the party who can control it. We can control how long our work takes. You cannot.

That only works if the scope is written properly, which is the actual difficulty.

## What a fixed-scope quote needs

### Outcomes, not tasks

"A checkout that works on mobile and passes accessibility review" rather than "20 hours of front-end work".

### An explicit exclusion list

The exclusions matter more than the inclusions. They are where disputes come from.

### Named dependencies

Copy, imagery, access, sign-off. With dates. If those slip, the timeline moves and the price does not.

### A change process

Not "no changes" — that is fiction. A stated way to price and schedule one.

!! A quote with no exclusion list is not a fixed price. It is an hourly quote that has not admitted it yet.

## What this changes

- We are paid for the result, so faster work benefits us both
- You can budget, because the number does not move
- Scope conversations happen before work starts, when they are cheap

## When hourly is honest

Genuine discovery, or an ongoing retainer where the work is by definition open. In both cases say so. What is not honest is quoting hourly for work whose shape is already known.`,
  },
  {
    slug: "keeping-a-site-secure-after-launch",
    title: "Keeping a site secure after the launch",
    excerpt:
      "Most breaches of small business sites are not clever. They are old dependencies, weak sessions and a form that trusted its input.",
    categorySlug: "security",
    categoryName: "Security",
    tags: ["security", "engineering"],
    readMinutes: 7,
    publishedAt: "2026-08-22",
    coverImage: "/blog/keeping-a-site-secure-after-launch.svg",
    content: `Sites are rarely broken into by someone targeting them. They are broken into by something scanning everything.

## The four that matter

### Dependencies that have stopped being updated

The most common route in. A package with a published vulnerability, a scanner that knows about it, a site that has not been deployed in nine months.

Automate the updates. Merge the security ones weekly.

### Sessions that cannot be revoked

If signing out does not invalidate a session server-side, a stolen cookie stays valid. Sessions should be records you can revoke, not just signed strings.

### Forms that trust their input

Anything a browser sends can be changed. Validate on the server, every time, including the fields that are hidden in the UI.

!! A price posted by a browser is a suggestion. Compute totals on the server, from your own data.

### Permissions checked once

Hiding a menu item is not a permission check. Every endpoint has to check for itself, because an endpoint is reachable whether or not the UI offers it.

## The unglamorous rest

1. Rate limit anything that can be guessed at: login, reset, contact
2. Log the sensitive actions with who did them
3. Keep secrets out of the browser bundle
4. Take backups, and restore one occasionally to prove they work

The last one is the item people are most confident about and least often test.`,
  },
  {
    slug: "content-that-ranks-and-sells",
    title: "Content that ranks and still sells",
    excerpt:
      "Writing for search and writing for buyers pull in different directions. The overlap is smaller than people think — and it is where to work.",
    categorySlug: "content",
    categoryName: "Content",
    tags: ["content", "seo"],
    readMinutes: 6,
    publishedAt: "2026-08-24",
    coverImage: "/blog/content-that-ranks-and-sells.svg",
    content: `Content written purely for search reads like it was written for a machine, because it was. Content written purely for buyers often answers a question nobody is asking. The useful work is in the overlap.

## Find the overlap

Search demand tells you what people type. Sales calls tell you what they actually want to know. The overlap is the list of things worth writing.

Ask your sales team for the five questions they answer on every call. Then check whether anyone searches for them. Usually three of the five do.

## Structure for both

### Answer in the first paragraph

Someone who arrived from a search has a question. Answer it, then explain. Burying it costs you the reader and the featured snippet.

### Use headings as questions

They match how people search and they make the page skimmable for someone who is deciding whether to read on.

### Be specific enough to be checkable

"Improves performance" is unfalsifiable and therefore worthless. "Cut LCP from 4.1s to 1.8s" can be checked, which is why it persuades.

!! If a paragraph would survive being copied onto a competitor's site unchanged, it is not doing any work.

## What to stop doing

- Writing to a word count
- Repeating the target phrase
- Publishing on a schedule rather than when there is something to say

## What to measure

Not rankings. Assisted conversions and the pages sales actually send to prospects. A page your team links to in an email is worth more than one sitting at position three.`,
  },
  {
    slug: "when-to-rebuild-and-when-to-fix",
    title: "When to rebuild, and when to just fix it",
    excerpt:
      "A rebuild is the most expensive answer to most problems. Four tests for whether you actually need one.",
    categorySlug: "strategy",
    categoryName: "Strategy",
    tags: ["strategy", "engineering"],
    readMinutes: 6,
    publishedAt: "2026-08-26",
    coverImage: "/blog/when-to-rebuild-and-when-to-fix.svg",
    content: `Rebuilds are proposed more often than they are needed, partly because agencies are paid more for them. Here are the honest tests.

## Test 1: is the problem in the content or the container?

Most sites that feel wrong have a content problem. The messaging is unclear, the proof is thin, the structure follows the org chart. None of that is fixed by rebuilding.

Rewrite the top five pages first. If the site works after that, you did not need a rebuild.

## Test 2: can one person change a page without a developer?

If not, that is a real problem — and it is usually solvable by adding a CMS to what you have.

## Test 3: is the performance floor reachable?

Some platforms cannot get fast. If a theme loads six hundred kilobytes of JavaScript before your content, no amount of tuning gets you there. That is a genuine rebuild reason.

## Test 4: does the roadmap need something the platform cannot do?

Memberships, a portal, an integration, multiple languages. If the next two years require it and the platform will not, rebuild now rather than twice.

!! Two yeses out of four usually means fix. Three or four means rebuild.

## If you do rebuild

- Keep the URLs
- Move the content deliberately, not wholesale
- Start with the templates that carry commercial pages
- Set the performance budget before the first line of code

And write down what was wrong with the old site. It is the only way to know whether the new one is better, and it is remarkable how often nobody does.`,
  },
  {
    slug: "working-with-an-agency-remotely",
    title: "Working with an agency across time zones",
    excerpt:
      "Distributed delivery works when the handover is designed. Here is the rhythm we use, and what it needs from both sides.",
    categorySlug: "process",
    categoryName: "Process",
    tags: ["process", "delivery"],
    readMinutes: 5,
    publishedAt: "2026-08-28",
    coverImage: "/blog/working-with-an-agency-remotely.svg",
    content: `Time zones are only a problem when the work depends on synchronous conversation. Most of it does not.

## Design the handover

The overlap window is for decisions. Everything else is written.

### What goes in writing

- What was done, with links to it
- What is blocked, and by whom
- What the next decision is, and when it is needed

Sent at the end of our day, which is the start of yours. Read before the call, not during it.

## The rhythm

1. A short written update daily
2. One call a week, with an agenda sent the day before
3. A demo every two weeks, on a real environment
4. A written decision log, kept in one place

!! The decision log is the item teams skip and later wish they had. Six weeks in, nobody remembers why a choice was made, and the log is the only thing that does.

## What we need from you

### One person who can decide

Not one person who can relay questions to people who can decide.

### Feedback in one pass

Five rounds of one comment each cost more than one round of twenty.

### Access, early

Hosting, analytics, the CMS, the domain. Chasing access is the most common cause of a lost week, and it is the easiest thing to avoid.

## What you should expect

A named contact, a schedule you can plan around, and no surprises at the end. If a project is going badly, you should hear it from us in the weekly update, not discover it at launch.`,
  },
];

export const team: TeamSeed[] = [
  {
    name: "Ataullah Mesbah",
    role: "Founder & Principal Consultant",
    bio: "Leads strategy and delivery across the agency. Fifteen years building and marketing web platforms, with a bias toward measurable outcomes over deliverable counts.",
    position: 1,
  },
  {
    name: "Rifat Khan",
    role: "Lead Engineer",
    bio: "Owns architecture across the Next.js and PostgreSQL stack. Spends most of a project's first week on the boring decisions that make the last week uneventful.",
    position: 2,
  },
  {
    name: "Anika Sultana",
    role: "Head of Search",
    bio: "Technical SEO and content strategy. Prefers a log-file export to a keyword tool, and will tell you when a term is not worth chasing.",
    position: 3,
  },
  {
    name: "Shafin Ahmed",
    role: "Design Lead",
    bio: "Brand identity and design systems. Builds the tokens and documentation that let a brand survive being applied by people who were not in the workshop.",
    position: 4,
  },
  {
    name: "Maria Islam",
    role: "Client Delivery Manager",
    bio: "Runs the delivery process end to end — scope, timeline, communication and the weekly demo. The reason projects land when they were said to.",
    position: 5,
  },
];

export const navigation: NavItemSeed[] = [
  { location: "HEADER", label: "Services", href: "/services", position: 1 },
  { location: "HEADER", label: "Work", href: "/work", position: 2 },
  { location: "HEADER", label: "Industries", href: "/industries", position: 3 },
  { location: "HEADER", label: "Pricing", href: "/pricing", position: 4 },
  { location: "HEADER", label: "About", href: "/about", position: 5 },
  { location: "HEADER", label: "Blog", href: "/blog", position: 6 },
  { location: "FOOTER_SERVICES", label: "Web Development", href: "/services/web-development", position: 1 },
  { location: "FOOTER_SERVICES", label: "E-commerce", href: "/services/ecommerce-development", position: 2 },
  { location: "FOOTER_SERVICES", label: "SEO", href: "/services/seo", position: 3 },
  { location: "FOOTER_SERVICES", label: "Paid Media", href: "/services/digital-marketing", position: 4 },
  { location: "FOOTER_SERVICES", label: "AI & Automation", href: "/services/ai-automation", position: 5 },
  { location: "FOOTER_COMPANY", label: "About", href: "/about", position: 1 },
  { location: "FOOTER_COMPANY", label: "Case Studies", href: "/work", position: 2 },
  { location: "FOOTER_COMPANY", label: "Industries", href: "/industries", position: 3 },
  { location: "FOOTER_COMPANY", label: "Blog", href: "/blog", position: 4 },
  { location: "FOOTER_COMPANY", label: "Contact", href: "/contact", position: 5 },
  { location: "FOOTER_COMPANY", label: "Support", href: "/support", position: 6 },
  { location: "FOOTER_LEGAL", label: "Terms of Service", href: "/terms", position: 1 },
  { location: "FOOTER_LEGAL", label: "Privacy Policy", href: "/privacy", position: 2 },
  { location: "FOOTER_LEGAL", label: "Refund Policy", href: "/refund-policy", position: 3 },
  { location: "FOOTER_LEGAL", label: "Cookie Policy", href: "/cookies", position: 4 },
];
