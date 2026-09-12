# PRD → implementation map

Covers PRD v4.0 (Parts I–II) and the v5.0 rework in `docs/PRD-v5.md` (Part III).

Where each requirement lives, and what was deliberately deferred.

## Part I — core product

| § | Requirement | Where |
|---|---|---|
| 3 | Next.js App Router, TypeScript, PostgreSQL, Prisma, Tailwind, Zod | Throughout; `package.json`. Three.js was dropped in v5 — the hero is hand-drawn SVG |
| 4–5 | Global design system and themes | Superseded by v5 §1–3 below |
| 6 | Public sitemap | `src/app/(marketing)/**`, `src/app/sitemap.ts` |
| 7 | Homepage: announcement, hero, capability rail, services, why, process, work, industries, testimonials, metrics, FAQ, CTA | `src/app/(marketing)/page.tsx`, `src/components/marketing/sections.tsx` |
| 8 | Service catalogue and detail model | `prisma/schema.prisma` (Service*), `src/app/(marketing)/services/**` |
| 9 | Registration, login, verification, reset, sessions, security page | `src/actions/auth.ts`, `src/app/(auth)/**`, `src/app/dashboard/security` |
| 10 | Client dashboard | `src/app/dashboard/my-*`, `profile`, `security` |
| 11 | Admin modules | `src/app/dashboard/**` |
| 12 | RBAC with granular permissions | `src/lib/rbac.ts` |
| 13 | Finance: accounts, invoices, payments, expenses, transactions, refunds, reports, exports, audit | `src/app/dashboard/finance/**`, `src/actions/finance.ts` |
| 14 | Payment architecture behind an interface; no client-side trust | `src/actions/finance.ts`, `PaymentMethodConfig` |
| 15 | Messaging with membership checks and internal notes | `src/actions/messages.ts`, `src/app/dashboard/messages/**` |
| 16 | Notifications: bell, badge, dropdown, detail page, delivery log | `src/lib/notifications.ts`, `src/components/dashboard/topbar.tsx`, `src/app/dashboard/notifications/**` |
| 17 | Contact → lead → in-app/email/Telegram, persisted before delivery | `src/actions/public.ts` |
| 18 | CMS for homepage, services, blog, case studies, testimonials, FAQ, navigation, theme, SEO | `src/app/dashboard/content/**`, `src/actions/content.ts` |
| 19 | Database model | `prisma/schema.prisma` |
| 20–21 | Security and API/route model | `src/lib/auth/guards.ts`, `src/middleware.ts`, `next.config.ts` |
| 22 | Performance engineering | SSG/ISR, Server Components, icon registry, one shared observer; see v5 §10 |
| 23 | SEO, canonicals, OG, sitemap, robots, structured data | `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts` |
| 24 | Analytics and event tracking | `src/components/marketing/tracking.tsx`, `src/lib/tracking.ts` |
| 25 | Reports and CSV export | `src/app/dashboard/finance/reports`, `src/app/api/reports/export/route.ts` |
| 26 | Audit and security log | `src/lib/audit.ts`, `src/app/dashboard/audit` |
| 27–28 | Free-tier-first infrastructure and provider adapters | `src/lib/providers/**`, `docs/DEPLOYMENT.md` |
| 29–30 | Sidebars | `src/lib/rbac.ts` (`navigationFor`) |
| 32 | Testing strategy | `tests/smoke.mjs` (E2E + authorization), `tests/lifecycle.mjs` (request → ticket → invoice), `tests/portal.mjs` (enquiry → quote → invoice, user management), `tests/signoff.mjs` (cancellation window, closing); see gaps below |
| 33 | Acceptance criteria | Verified by `tests/smoke.mjs` and the guards it exercises |
| 34 | Project structure | See README |
| 37 | Non-negotiable engineering rules | Enforced in guards, finance actions and the CSP |

## Part II — enhancements

| § | Requirement | Where |
|---|---|---|
| 38 | Finalised tech decisions | `src/lib/rate-limit.ts` (Upstash), `src/lib/providers/jobs.ts` (QStash), pooled `DATABASE_URL` |
| 39 | Visual design system, micro-interactions, bento layout, scroll storytelling, animated counters | `globals.css`, `sections.tsx`, `reveal.tsx` |
| 39.5–39.6 | Skeletons, mobile-first, soft dark navy, social proof near the fold, portfolio filter, pricing comparison, exit-intent CTA, trust badges, outline login button, searchable FAQ, branded 404/maintenance | `skeleton.tsx`, `widgets.tsx`, `work-filter.tsx`, `pricing`, `faq-search.tsx`, `not-found.tsx`, `maintenance` |
| 39.7 / 52 | Brand assets and favicon kit | `public/`, `public/brand/`, `docs/BRAND.md` |
| 40 | Rendering strategy, pooling, indexing, jobs, rate limiting, media/bundle/edge caching | `next.config.ts`, `schema.prisma` indexes, `providers/jobs.ts`, `rate-limit.ts` |
| 41 | Security architecture incl. Server Actions as public endpoints | `src/actions/**` (every action: auth → permission → Zod → ownership → audit) |
| 41.5 | Toast system | `src/components/ui/toast.tsx` |
| 41.6 | Audit coverage | `src/lib/audit.ts`, called from every sensitive mutation |
| 42 | A distinct dashboard per role | `src/lib/rbac.ts`, `src/app/dashboard/page.tsx` |
| 43 | Dashboard-controlled payments, manual flow, unique TrxID, fraud controls | `src/app/dashboard/settings/payments`, `src/actions/finance.ts`, `payment-submission.tsx` |
| 44 | GA4, GTM, Clarity, Meta Pixel, Meta CAPI — consent-gated | `tracking.tsx`, `src/lib/tracking.ts`, `cookie-consent.tsx` |
| 45 | Two-stage maintenance: notice banner then full mode, with staff bypass and countdown | `settings/maintenance`, `middleware.ts`, `app/maintenance` |
| 46 | Global settings panel | `src/app/dashboard/settings/**` |
| 47 | Non-developer CMS usability: structured forms, preview, safe options, inline guidance, archive-not-delete | `content-forms.tsx`, `service-editor.tsx`, `field.tsx` |
| 48 | Growth features: quote calculator, WhatsApp widget, visual timeline, referral codes, document storage | `quote-calculator.tsx`, `widgets.tsx`, `my-projects`, `my-documents` |
| 49 | New entities | `PaymentMethodConfig`, `MaintenanceNotice`, `TrackingConfig`, `FeatureFlag`, `ClientDocument` |
| 50 | Additional acceptance criteria | Enforced in `finance.ts` (inactive method, duplicate TrxID, permission-gated verify) and covered by the smoke test |
| 51 | Hero direction with performance guardrails | Replaced in v5 by `network-visual.tsx` — SVG, no 3D library |
| 53 | Launch readiness | `docs/DEPLOYMENT.md` |

## Part III — v5.0 rework

| § | Requirement | Where |
|---|---|---|
| 1 | Three themes (Daylight, Midnight, Network), light by default, visitor toggle, admin able to offer both or lock one | `src/styles/tokens.css`, `src/lib/theme.ts`, `src/components/ui/theme.tsx`, `dashboard/settings/theme` |
| 2 | Professional type scale, gradient headings retired | `tokens.css` (`--step-*`), `src/app/layout.tsx` |
| 3 | Button system redrawn, tuned per theme | `src/components/ui/button.tsx` |
| 4 | Homepage rebuild: global-network hero, 2–3 slide slider, sponsor marquee, more sections, 20-question FAQ | `hero.tsx`, `network-visual.tsx`, `sponsors.tsx`, `sections.tsx`, `accordion.tsx` |
| 5 | Navigation: sticky shrink, working dropdowns, focus-trapped mobile drawer | `src/components/marketing/navbar.tsx` |
| 6 | Dashboard: identity in the sidebar, drawer and rail, working notification bell, charts beside figures, PDF/XLSX reports, staff-raised and reassignable tickets, per-role user tabs, fixed integration toggles | `src/components/dashboard/**`, `src/lib/reports/**`, `dashboard/support`, `dashboard/users`, `dashboard/integrations` |
| 7 | Contact → dashboard notification + reply + Resend; WhatsApp toggle; Gemini assistant limited to public content | `src/actions/public.ts`, `src/lib/providers/email.ts`, `src/components/marketing/assistant.tsx`, `src/lib/ai/**` |
| 8 | Free tier first, paid later without code changes | `docs/ENV-SETUP.md` §4, `src/lib/providers/**` |
| 9 | API security, rate limiting, super-admin-only data | `src/middleware.ts` (public API allow-list), `src/lib/rate-limit.ts`, `src/lib/auth/guards.ts` |
| 10 | 95+ on mobile and desktop, SEO/GEO/AEO | Measured: desktop 100 across the board; mobile 92–98 performance, 100 a11y/best-practices/SEO |
| 11 | Styling controlled globally, not per page | `src/styles/tokens.css` → `tailwind.config.ts` |
| 12 | Demo data on every previously blank surface, editable afterwards | `prisma/demo-data.ts` |

## Part IV — v5.2

| Requirement | Where |
|---|---|
| Maintenance mode that does not lock staff out, and says plainly that staff bypass it | `src/middleware.ts` (`MAINTENANCE_EXEMPT`), `dashboard/settings/maintenance` |
| Kill switch applies immediately rather than after a cache window | `src/app/api/system/status/route.ts` |
| Scroll reveal with no hydration mismatch | `src/styles/globals.css` (`animation-timeline: view()`) |
| Unread badge clears when the panel is opened | `src/components/dashboard/topbar.tsx` |
| Navbar shows Dashboard once signed in, without making public pages dynamic | `AUTH_HINT_COOKIE`, `ThemeScript`, `[data-auth]` rules |
| Service request timeline shared by staff and client, with internal notes | `src/actions/requests.ts`, `src/components/dashboard/request-thread.tsx` |
| Status and progress a client can see; notification on every change | `dashboard/requests/[id]`, `dashboard/my-services/[id]` |
| Client cancellation, outright before an order and by request after | `requestCancellationAction` |
| Attachments (image or PDF) on requests and replies, both sides | `src/lib/attachments.ts` |
| Staff raising a bespoke request against a client | `createCustomRequestAction` |
| Blog body syntax: h2-h6, images, highlight callouts, lists | `src/components/ui/markdown.tsx` |
| Twenty articles with covers, published two days apart | `src/content/marketing.ts`, `public/blog/` |
| Per-slide hero artwork, world map with the HYASCKA marker | `world-map.tsx`, `network-visual.tsx`, `metric-visual.tsx` |
| Process section rebuilt; engagement steps and commitments added | `src/components/marketing/sections.tsx` |

## Deliberate deviations

**Authentication.** The PRD names Auth.js or Better Auth. This build uses a first-party
session layer — bcrypt hashing, a `jose`-signed HttpOnly cookie and a `Session` table —
because it keeps the edge middleware free of Node-only dependencies, makes session
revocation and the Security page straightforward, and removes a large dependency from a
security-critical path. Every rule the PRD sets for authentication is met. OAuth is the
one thing this trades away; adding a provider later is a contained change in
`src/actions/auth.ts` and `src/lib/auth/session.ts`.

**Charts.** Finance reports use server-rendered bars with the values printed beside them
rather than a charting library, honouring §40.6 (keep heavy libraries out of the bundle)
and keeping the data readable without colour.

**Forms.** React Hook Form is not used. Forms are progressively-enhanced Server Action
forms, which ship less client JavaScript and work without hydration.

## Known gaps

These are scoped but not built, and are the natural next iteration:

- **Test depth.** Four end-to-end suites cover the critical paths, the design system,
  the authorization boundaries and the client lifecycle: `smoke` (66 checks),
  `portal` (20), `signoff` (14) and `lifecycle` (12). Unit tests for the finance
  calculations, and integration tests for the notification workflows, are not written
  yet. Signing in is rate limited to five attempts per five minutes, so the suites are
  run one at a time rather than back to back.
- **Mobile performance.** Desktop measures 100 on every page. Mobile measures
  93–97, with accessibility, best practices and SEO at 100 throughout. The
  remaining cost is LCP: around 2.6s under Lighthouse's 1.6 Mbps / 4× CPU
  throttle, almost all of it the web font, which cannot paint the hero text any
  sooner without dropping the family the design is built on.
- **Payments.** A client submits a payment against an invoice and staff verify it,
  which generates the invoice record they can download. The gateway redirect and
  webhook are still not implemented — the manual flow is complete.
- **Gateway payments.** The SSLCommerz adapter is configurable and toggleable, but the
  redirect and webhook handlers are not implemented — the manual flow is complete.
- **Orders.** The offer → acceptance → confirmation → invoice lifecycle runs on the
  service request itself: staff quote, the client accepts or declines, staff confirm and
  bill the accepted amount, then close the work. The separate `Proposal` and `Order`
  records still have read views only, and are not yet part of that flow.
- **Multi-language.** English only; the localisation setting exists as a placeholder.
