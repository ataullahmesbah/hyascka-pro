# HYASCKA — Digital Agency Website & Business Platform

**A production-grade agency website and the business platform behind it — built with Next.js 15, TypeScript, Tailwind CSS, Prisma and PostgreSQL.**

HYASCKA is a digital service provider in Dhaka, Bangladesh, working worldwide: web development, e-commerce, SEO, paid media, brand design and AI automation. This repository is the whole thing — the public marketing site, the CMS that edits it, and the client portal, CRM, project tracker, invoicing and role-based dashboards that run the business behind it.

![Next.js 15](https://img.shields.io/badge/Next.js-15-000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql&logoColor=white)

---

## Table of contents

- [What this is](#what-this-is)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Testing](#testing)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Security](#security)
- [Before you go live](#before-you-go-live)
- [Documentation](#documentation)

---

## What this is

Most agency sites are a brochure with a contact form bolted on, and the actual business —
who enquired, what was quoted, what was invoiced, what was delivered — lives in a
spreadsheet somewhere else. This one does not split.

An enquiry arrives on the public site, lands in the CRM, becomes a client account, becomes
a project with milestones the client can watch, becomes an invoice with a payment record
and a ledger entry, and every step of it is audited. The marketing copy, the service
catalogue, the prices, the blog and the homepage itself are edited from the dashboard by
someone who has never opened a code editor.

**87 pages** across the public site, the authentication flow and the dashboards, over a
**66-model** domain schema.

---

## Features

### Public marketing website

- **Two-audience hero** — a visitor picks "HYASCKA" or "Consulting & Services" before
  anything else, so a four-slide agency story and a consulting pitch share one hero
  without either drowning the other. Works with JavaScript disabled: the choice is CSS.
- **Service catalogue** with packages, feature lists, delivery process, FAQs, per-service
  estimate ranges and a quote calculator driven by the real starting price.
- **Case studies, industries, pricing, blog, FAQ, support and the full legal set**
  (terms, privacy, refunds, cookies) — every one of them CMS-editable.
- **AI chat assistant** answering from published content only — services, prices, FAQs,
  case studies, contact details. Runs on **Groq** or **Google Gemini**; whichever API key
  is present is the one used. It replies in the language the visitor wrote in, including
  Bangla and Banglish.
- **Three themes** (Daylight, Midnight, Network) and five typefaces, offered to the
  visitor or locked by an admin.
- **SEO built in** — per-page metadata from the CMS, JSON-LD structured data,
  auto-generated `sitemap.xml` and `robots.txt`, Open Graph images, canonical URLs.
- Cookie consent, exit-intent offer, WhatsApp button, newsletter, announcement bar —
  each one a feature flag an admin can switch off.

### Business platform

Seven roles, each with its own dashboard shell: `SUPER_ADMIN`, `ADMIN`, `FINANCE`,
`PROJECT_MANAGER`, `EDITOR`, `SUPPORT`, `CLIENT`.

| Module | What it does |
|---|---|
| **Leads & CRM** | Pipeline, owner assignment, notes, one-click conversion to a client account |
| **Clients** | Accounts, projects, invoices, outstanding balance, support history |
| **Projects** | Milestones, tasks, activity feed, client-visible files, progress that notifies the client |
| **Service lifecycle** | Request → quote → client accepts → confirmed → in progress → delivered → signed off and closed |
| **Finance** | Invoices, payments, expenses, ledger, refunds, reports, CSV export |
| **Content CMS** | Homepage sections, hero slides, services, blog with preview, case studies, testimonials, FAQs, navigation |
| **Media & SEO** | Asset library with signed uploads, per-page metadata health, sitemap and robots control |
| **Users & roles** | A tab per role, role and status changes with confirmation, live permission matrix |
| **Audit & security** | Every sensitive mutation, plus failed logins and rate-limit events |
| **Support** | Tickets from clients and staff, reassignment, threaded replies |
| **Reports** | Daily, weekly and monthly exports as real PDF and XLSX files |
| **Settings** | Brand, theme governance, sponsors, widgets, contact, payments, tracking, SEO, maintenance, feature flags |
| **Client portal** | Services, projects, invoices, payments, documents, messages, support, profile, security |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS 3 over a single CSS custom-property token file |
| Database | PostgreSQL (Neon), Prisma 6 |
| Auth | Session cookies, bcrypt, role-based access control |
| Validation | Zod on every server entry point |
| Email | Resend or SMTP, behind one adapter |
| Media | Cloudinary or local disk, behind one adapter |
| AI | Groq or Google Gemini, behind one adapter |
| Charts | Hand-built SVG — no charting library in the bundle |

---

## Quick start

**Requirements:** Node.js 18.18 or newer (20 LTS recommended) and a PostgreSQL database — Neon's free tier is plenty.

```bash
git clone https://github.com/ataullahmesbah/hyascka-pro.git
cd hyascka-pro
npm install

cp .env.example .env.local      # for the app
cp .env.example .env            # for the Prisma CLI

# Fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET and SEED_ADMIN_PASSWORD.
# Generate the auth secret with:  openssl rand -base64 48

npm run db:push                 # create the schema
npm run db:seed                 # catalogue, content, settings, demo data
npm run dev                     # http://localhost:3000
```

The seed prints the owner account it created, once, in your terminal. It is built from
`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, so **set a strong password in your
environment before seeding** and change it again from the dashboard afterwards.

> **No database yet?** The public site still runs. Every public read falls back to the
> bundled content in `src/content/`, so you get the full marketing site before a database
> exists. Authentication, the dashboard and finance need a real one — those fail loudly
> rather than pretending to work.

---

## Configuration

Only three variables are required: `DATABASE_URL`, `DIRECT_URL` and `AUTH_SECRET`.

Every integration is optional, and the feature it powers stays switched off until you fill
it in — nothing else breaks:

| Integration | Turns on | Free tier |
|---|---|---|
| **Resend** or SMTP | Outbound email — enquiry replies, invoices, password resets | Yes |
| **Cloudinary** | Image and file uploads from the dashboard | Yes |
| **Groq** or **Gemini** | The AI chat assistant | Yes |
| **Telegram bot** | Instant alerts for enquiries, payments and new requests | Yes |
| **Upstash Redis** | Rate limiting shared across instances — needed once you run more than one | Yes |

`docs/ENV-SETUP.md` explains every variable, where to get each value and what happens when
it is left empty.

**Never commit `.env` or `.env.local`.** Both are git-ignored; keep it that way. Real
values belong in your hosting provider's environment settings, not in the repository.

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
| `npm run db:reset` | Drop, recreate and reseed — **destructive** |
| `npm run db:studio` | Prisma Studio |
| `npm run test:smoke` | End-to-end smoke test |
| `npm run test:lifecycle` | Request → ticket → invoice lifecycle |
| `npm run test:portal` | Client portal: enquiry → quote → invoice, and user management |
| `npm run test:signoff` | Cancellation window and closing a delivered piece of work |

---

## Testing

The end-to-end suites drive a real browser against a built app and a seeded database.

```bash
npm run build && npm start &
npm run test:smoke -- http://localhost:3000
```

The smoke suite runs **66 checks**: public pages render, the theme toggle works, the
homepage carries its FAQ set, the hero slider and scroll reveals behave, the announcement
bar stays dismissed, the API allow-list holds, a logged-out visitor cannot reach the
dashboard, a client session is blocked from staff modules even by typing the URL, every
admin module loads with rows in it, the notification badge clears itself, and the PDF and
XLSX exports are real files.

---

## Architecture

**Rendering.** Public pages are statically generated with a five-minute revalidation
window; publishing from the CMS calls `revalidatePath`, so an edit is live in seconds
without a rebuild. Server Components by default — client JavaScript only where something
genuinely has to be interactive.

**Finance integrity.** Invoice totals are computed server-side from line items; a price
posted by a browser is never trusted. Transaction references are globally unique, so the
same reference cannot be reused across invoices. Payment verification, invoice balance and
the ledger entry all move inside one database transaction, and verifying an
already-decided payment is rejected rather than double-counted. Nothing financial is
deleted: invoices are voided, payments are refunded, and every step is audited.

**Design system.** One token file, `src/styles/tokens.css`, holds every colour, type step,
space, radius and easing. Tailwind maps through it, so a theme changes in one place rather
than page by page.

**Performance.** The hero globe and the world map are hand-drawn SVG — no 3D library, no
map tiles, no charting library. Scroll reveals, the hero slider and the counters are
server-rendered markup driven by one client effect sharing a single IntersectionObserver,
rather than a client component per element. Icons come from an explicit registry, not a
namespace import that would drag the whole set into the bundle. Shared First Load JS is
about **102 kB**. Last measured with Lighthouse 12: desktop 100 across all four
categories, mobile in the low-to-mid 90s.

**Provider adapters.** Email, storage, notifications, rate limiting, background jobs and
the AI assistant all sit behind interfaces in `src/lib/`. Swapping Resend for SMTP,
Cloudinary for S3, or Gemini for Groq is a change in one adapter, not in the domain layer.
Every adapter degrades safely when its provider is not configured.

**Database.** `DATABASE_URL` is the pooled endpoint used at runtime; `DIRECT_URL` is the
non-pooled endpoint used only by migrations. Every foreign key, filtered column and
sort or pagination column is indexed explicitly in the schema.

---

## Project structure

```
prisma/          schema.prisma (full domain model, explicit indexes) + seed.ts
public/          favicon kit, PWA icons, OG image, brand assets, hero artwork
src/
  actions/       Server Actions — auth, crm, finance, content, settings, users, messages
  app/
    (marketing)/ public website
    (auth)/      login, register, password reset, email verification
    dashboard/   role-based dashboards
    api/         status, chat, contact, media upload, report export
  components/
    ui/          design-system primitives (button, card, field, table, toast, theme…)
    marketing/   navbar, footer, hero, visuals, sections, assistant, consent, widgets
    dashboard/   shell, sidebar, topbar, forms, editors
    auth/        sign-in and password forms
  content/       default catalogue and marketing copy (seed source + fallback)
  lib/           db, rbac, auth, settings, content, seo, tracking, audit, rate limiting, ai
  styles/        tokens.css (the single source of design truth) + globals.css
tests/           end-to-end suites
docs/            PRD, environment setup, brand guide, deployment, coverage map
```

---

## Security

Deny-by-default on `/dashboard/*`. Middleware verifies the signed session cookie at the
edge, and then every page and every Server Action re-resolves that session against the
database and re-checks permissions. **Hiding a menu item is never the security boundary.**

Server Actions are treated as public endpoints. Each one authenticates, authorises,
validates its input with Zod, re-verifies ownership from the database, mutates, and writes
an audit entry.

- Passwords are hashed with bcrypt — never stored or logged in any recoverable form.
- Sessions are HttpOnly cookies, listed and revocable from the Security page. Changing a
  user's role or status ends their sessions immediately.
- Login, registration, password reset, contact, messaging, chat and payment submission are
  all rate limited.
- Secrets stay server-side. API keys are read in server-only modules and never reach the
  browser bundle; only `NEXT_PUBLIC_*` variables are ever exposed.
- The AI assistant reads published content only. Accounts, invoices, payments, projects and
  customer records are not filtered out of its context — they are never fetched into it.
- The CMS has no raw-HTML field anywhere; content is structured input, not markup.
- Uploads are signed, type-checked and size-capped.

**Found a security issue?** Please report it privately through the contact form on the
site rather than opening a public issue.

---

## Before you go live

1. **Change every seeded password**, and delete the demo staff and client accounts you do
   not need.
2. **Replace the placeholder content.** The demo case studies, testimonials and homepage
   metrics are placeholders. No unverifiable claim should ship — swap them for real
   figures from Dashboard → Content.
3. **Set a real `AUTH_SECRET`** in your hosting environment, not the example value.
4. **Rotate any key** that has ever been pasted into a chat, a screenshot or a commit.
5. Work through the go-live checklist in `docs/DEPLOYMENT.md`: environment audit, backups,
   staging, consent, load testing and monitoring.

---

## Documentation

| File | Contents |
|---|---|
| `docs/ENV-SETUP.md` | Every environment variable, where to get each value, what breaks without it |
| `docs/DEPLOYMENT.md` | Go-live checklist, hosting, backups, monitoring |
| `docs/BRAND.md` | Logo, colour, typography and voice |
| `docs/PRD-v5.md` | The product requirements this was built against |
| `docs/PRD-COVERAGE.md` | Requirement-to-code coverage map |

---

## Licence

Private and proprietary. © HYASCKA. All rights reserved.

---

<sub>**Keywords:** digital agency website template · Next.js 15 agency starter · agency CMS ·
client portal · CRM and invoicing · service catalogue · SEO-ready Next.js site ·
AI chat assistant · Groq · Gemini · Prisma · PostgreSQL · TypeScript · Tailwind CSS ·
role-based dashboard · Bangladesh web development agency</sub># hyascka-pro
