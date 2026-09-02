# HYASCKA — Digital Service Provider

A premium agency website **and** the business platform behind it: public marketing site,
CMS, client portal, CRM, projects, finance, payments, messaging, notifications and
role-based dashboards — built to the HYASCKA PRD v4.0.

```
Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Prisma · Three.js
```

---

## Quick start

```bash
npm install
cp .env.example .env.local        # and .env for the Prisma CLI
# fill in DATABASE_URL, DIRECT_URL and AUTH_SECRET (openssl rand -base64 48)

npm run db:push                   # create the schema
npm run db:seed                   # catalogue, content, settings and demo data
npm run dev                       # http://localhost:3000
```

**No database yet?** The public site still runs. Every public read falls back to the
bundled content in `src/content/`, so `npm run dev` gives you the full marketing site
before Neon is provisioned. Authentication, the dashboard and finance require a real
database — those fail loudly rather than pretending to work.

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@hyascka.com` | `ChangeMe#2026` |
| Admin | `admin.demo@hyascka.com` | `ChangeMe#2026` |
| Finance | `finance@hyascka.com` | `ChangeMe#2026` |
| Project Manager | `pm@hyascka.com` | `ChangeMe#2026` |
| Editor | `editor@hyascka.com` | `ChangeMe#2026` |
| Support | `support@hyascka.com` | `ChangeMe#2026` |
| Client | `client@northlane.example` | `ChangeMe#2026` |

> Change every one of these before the site is reachable from the internet.
> Override the owner account with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next/core-web-vitals + TypeScript) |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Seed catalogue, content, settings and demo data |
| `npm run db:reset` | Drop, recreate and reseed (destructive) |
| `npm run db:studio` | Prisma Studio |
| `npm run test:smoke` | End-to-end smoke test against a running server |

Smoke test (needs a built app running and a seeded database):

```bash
npm run build && npm start &
npm run test:smoke -- http://localhost:3000
```

It checks that the public pages render, that a logged-out visitor cannot reach the
dashboard, that a CLIENT session is blocked from finance/users/leads/audit even by
typing the URL, and that every Super Admin module loads.

---

## What is in here

### Public website
`/` `/services` `/services/[slug]` `/work` `/work/[slug]` `/industries` `/industries/[slug]`
`/about` `/pricing` `/blog` `/blog/[slug]` `/faq` `/contact` `/support`
`/terms` `/privacy` `/refund-policy` `/cookies` `/maintenance` + a branded 404.

Statically generated with a 5-minute revalidation window; publishing from the CMS calls
`revalidatePath` so a change is live in seconds without a rebuild.

### Dashboard — a distinct shell per role
`SUPER_ADMIN` · `ADMIN` · `FINANCE` · `PROJECT_MANAGER` · `EDITOR` · `SUPPORT` · `CLIENT`

The sidebar for each role is **generated from the permission matrix** in
`src/lib/rbac.ts`, and the server independently re-checks that matrix on every page load
and every Server Action. A role never sees a menu item it cannot use, and hiding a menu
item is never the security boundary.

| Module | Highlights |
|---|---|
| Leads & CRM | Pipeline, owner assignment, notes, one-click conversion to a client account |
| Clients | Accounts, projects, invoices, outstanding balance, support history |
| Projects | Milestones, tasks, activity feed, client-visible files, progress that notifies the client |
| Finance | Invoices, payments, expenses, ledger, refunds, reports, CSV export |
| Content CMS | Homepage sections, services, blog (with preview), case studies, testimonials, FAQ, navigation |
| Media & SEO | Asset library, per-page metadata health, sitemap/robots |
| Users & roles | Role and status changes, live permission matrix |
| Audit & security | Every sensitive mutation, plus failed logins and rate-limit events |
| Settings | Brand, theme, contact, payments, tracking, SEO, maintenance, feature flags |
| Client portal | Services, projects, invoices, payments, documents, messages, support, profile, security |

---

## Architecture notes

**Security.** Deny-by-default on `/dashboard/*`. Middleware verifies the signed session
cookie at the edge; every page and every Server Action re-resolves the session against
the database and re-checks permissions. Server Actions are treated as public endpoints —
each one authenticates, authorises, validates with Zod, re-verifies ownership from the
database, and writes an audit entry. Passwords are bcrypt-hashed, sessions are HttpOnly
and revocable from the Security page, and login, registration, password reset, contact,
messaging and payment submission are all rate limited.

**Finance integrity.** Invoice totals are computed server-side from line items — a price
posted by the browser is never trusted. Transaction IDs are globally unique, so the same
reference cannot be reused across invoices. Payment verification, invoice balance and the
ledger entry move inside one database transaction, and verifying an already-decided
payment is rejected rather than double-counted. Nothing financial is deleted: invoices are
voided, payments are refunded, and every step is audited.

**Performance.** Public pages are SSG + ISR. Server Components by default; the only client
JavaScript is genuine interactivity. Icons come from an explicit registry rather than a
namespace import (which would drag the whole icon set into the bundle). The single 3D
canvas on the site is the hero — dynamically imported, mounted only when it scrolls into
view, skipped entirely for reduced-motion users, and backed by a static image fallback.
Shared First Load JS is ~103 kB.

**Provider adapters.** `EmailService`, `StorageService`, notifications, rate limiting and
background jobs all sit behind interfaces in `src/lib/providers/`. Swapping Resend for
SMTP, Cloudinary for R2, or inline jobs for QStash is a change in one adapter, not in the
domain layer. Every adapter degrades safely when its provider is not configured.

**Database.** `DATABASE_URL` is the pooled (PgBouncer) Neon endpoint used at runtime;
`DIRECT_URL` is the non-pooled endpoint used only by migrations. Every foreign key, every
filtered column and every sort/pagination column is indexed explicitly in the schema.

---

## Project structure

```
prisma/          schema.prisma (full domain model, explicit indexes) + seed.ts
public/          favicon kit, PWA icons, OG image, brand assets
src/
  actions/       Server Actions — auth, crm, finance, content, settings, users, messages
  app/
    (marketing)/ public website
    (auth)/      login, register, password reset, email verification
    dashboard/   role-based dashboards
    api/         status endpoint, CSV report export
  components/
    ui/          design-system primitives (button, card, field, table, toast, theme…)
    marketing/   navbar, footer, hero + 3D canvas, sections, consent, tracking, widgets
    dashboard/   shell, sidebar, topbar, forms, editors
    auth/        sign-in and password forms
  content/       default catalogue and marketing copy (seed source + fallback)
  lib/           db, rbac, auth, settings, content, seo, tracking, audit, rate limiting
  styles/        globals.css — the design token layer
tests/           end-to-end smoke test
docs/            brand guide, deployment checklist, PRD coverage map
```

---

## Before launch

The demo case studies, testimonials and homepage metrics are **placeholders**. The PRD is
explicit that no fake claims may ship — replace them with real, verifiable figures from
Dashboard → Content before the site goes public.

`docs/DEPLOYMENT.md` carries the full go-live checklist: environment audit, backups,
staging, consent, load testing and monitoring.
