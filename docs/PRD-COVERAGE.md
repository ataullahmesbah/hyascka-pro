# PRD v4.0 → implementation map

Where each requirement lives, and what was deliberately deferred.

## Part I — core product

| § | Requirement | Where |
|---|---|---|
| 3 | Next.js App Router, TypeScript, PostgreSQL, Prisma, Tailwind, Zod, Three.js | Throughout; `package.json` |
| 4–5 | Global design system, Purple/Cyan identities, Light/Dark/System | `src/styles/globals.css`, `tailwind.config.ts`, `src/components/ui/theme.tsx` |
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
| 22 | Performance engineering | SSG/ISR, Server Components, dynamic import of the 3D hero, icon registry |
| 23 | SEO, canonicals, OG, sitemap, robots, structured data | `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts` |
| 24 | Analytics and event tracking | `src/components/marketing/tracking.tsx`, `src/lib/tracking.ts` |
| 25 | Reports and CSV export | `src/app/dashboard/finance/reports`, `src/app/api/reports/export/route.ts` |
| 26 | Audit and security log | `src/lib/audit.ts`, `src/app/dashboard/audit` |
| 27–28 | Free-tier-first infrastructure and provider adapters | `src/lib/providers/**`, `docs/DEPLOYMENT.md` |
| 29–30 | Sidebars | `src/lib/rbac.ts` (`navigationFor`) |
| 32 | Testing strategy | `tests/smoke.mjs` (E2E + authorization); see gaps below |
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
| 51 | 3D direction with performance guardrails | `hero-canvas.tsx`, `hero.tsx`, `IconBadge`, `.brand-ring` |
| 53 | Launch readiness | `docs/DEPLOYMENT.md` |

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

- **Test depth.** `tests/smoke.mjs` covers the critical paths and the authorization
  boundaries. Unit tests for finance calculations and status transitions, and integration
  tests for the notification workflows, are not written yet.
- **Media uploads.** The library reads and lists assets; the Cloudinary upload widget in
  the CMS is stubbed behind `src/lib/providers/storage.ts`.
- **PDF reports.** CSV export is implemented; PDF generation as a background job is not.
- **Gateway payments.** The SSLCommerz adapter is configurable and toggleable, but the
  redirect and webhook handlers are not implemented — the manual flow is complete.
- **Proposals and orders.** Read views exist; the offer → acceptance → order lifecycle is
  not yet an editable workflow.
- **Multi-language.** English only; the localisation setting exists as a placeholder.
