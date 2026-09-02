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
    answer:
      "With a paid discovery or a free 30-minute call, depending on scope. For anything above a small build we recommend a short discovery phase — sitemap, content model, performance budget and success metrics agreed in writing before development starts. It is the cheapest way to avoid an expensive misunderstanding.",
    category: "Working together",
    position: 1,
  },
  {
    question: "What does a project cost?",
    answer:
      "Marketing sites start at BDT 180,000, e-commerce builds at BDT 280,000, and retainers from BDT 25,000 per month. Every service page lists its own starting price and pricing model. After a discovery call you receive a fixed proposal with scope, deliverables and timeline — not an hourly estimate that drifts.",
    category: "Pricing",
    position: 2,
  },
  {
    question: "Do we own the code and the accounts?",
    answer:
      "Yes, without exception. The repository, database, ad accounts, analytics properties and every credential are created in your name. If we stop working together you keep everything, and we run a handover session rather than a shutdown.",
    category: "Working together",
    position: 3,
  },
  {
    question: "Can our team edit the site without a developer?",
    answer:
      "That is a build requirement, not an add-on. Homepage sections, services, pricing, blog, case studies, testimonials, FAQs, navigation, SEO metadata and the theme are all editable from the dashboard through structured forms, with preview before publishing.",
    category: "Platform",
    position: 4,
  },
  {
    question: "How do you handle payments and invoicing?",
    answer:
      "Through the client portal. Invoices are issued to your dashboard, and you can pay by bKash, Nagad, bank transfer or card gateway — whichever methods are active. Manual payments are submitted with a transaction ID and verified by our finance team, and every step is visible to you.",
    category: "Payments",
    position: 5,
  },
  {
    question: "What are your performance targets?",
    answer:
      "90+ Lighthouse on key public pages, Core Web Vitals in the green on real-device data, and WCAG 2.1 AA accessibility. These are written into the acceptance criteria of every build and verified in the deployment pipeline, not measured after the fact.",
    category: "Platform",
    position: 6,
  },
  {
    question: "Do you work with clients outside Bangladesh?",
    answer:
      "Yes. We work with clients across Asia, Europe and North America, and we invoice in BDT, USD, EUR or GBP. Delivery runs asynchronously with scheduled overlap hours agreed at kickoff.",
    category: "Working together",
    position: 7,
  },
  {
    question: "What happens after launch?",
    answer:
      "Thirty days of support are included with every build, covering bugs and small changes. Most clients then move to a monthly retainer for iteration, content and growth work. There is no obligation to — the site is fully yours to run.",
    category: "Working together",
    position: 8,
  },
  {
    question: "How is our data protected?",
    answer:
      "Every dashboard route and API endpoint denies by default and re-checks permissions server-side on every request. Passwords are hashed, sessions use HttpOnly cookies, sensitive endpoints are rate limited, and every financial or security-relevant action is written to an audit log.",
    category: "Security",
    position: 9,
  },
  {
    question: "Do you guarantee first-page rankings?",
    answer:
      "No, and we would be careful of anyone who does. Search engines do not sell that guarantee to anyone. We commit to the work, the reporting and the leading indicators, and we set realistic expectations per keyword group in the first month.",
    category: "Pricing",
    position: 10,
  },
];

export const posts: PostSeed[] = [
  {
    slug: "core-web-vitals-that-actually-move",
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
