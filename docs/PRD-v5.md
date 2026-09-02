# HYASCKA PRD v5.0 — Design overhaul, dynamic control & bug-fix release

Supersedes the design and dashboard sections of v4.0. Everything not restated here
carries forward unchanged.

---

## 0. Why this release exists

The v4.0 build shipped a working platform, but the visual layer failed its only real
test: it was tiring to look at. Heavy gradient text, a dark-first hero, weak buttons and
a generic font pairing made the site feel unfinished. Several dashboard controls were
also inert, and many pages rendered empty because there was no demo data.

v5.0 rebuilds the design system from tokens up, makes every visual and content decision
controllable from the dashboard by a non-developer, and closes the functional gaps.

---

## 1. Theme system — three themes, dashboard-governed

| Theme | id | Direction |
|---|---|---|
| **Daylight** (default) | `light` | Clean editorial light. White/near-white ground, one confident accent, generous whitespace, hairline borders, soft shadows. Reference: khalidfarhan.com. |
| **Midnight** | `midnight` | Near-black ground with violet accent and restrained glow. Reference: the Payoneer card creative. |
| **Network** | `network` | Deep navy with electric-blue accent and a faint hexagon-network texture. Reference: the blue network graphic. |

Rules:

1. **The site ships on Daylight.** Light is the initial and default experience.
2. **Dashboard → Settings → Theme** controls three things:
   - `defaultTheme` — which theme a first-time visitor sees.
   - `enabledThemes` — which themes appear in the visitor's toggle.
   - `allowUserToggle` — when off, the navbar toggle disappears and every visitor is
     locked to `defaultTheme`.
3. When exactly one theme is enabled, the toggle hides automatically.
4. Theme is applied before first paint via an inline script — no flash.
5. `prefers-color-scheme` is honoured only when the visitor has expressed no preference
   and both a light and a dark theme are enabled.

No theme may be defined by free-form CSS. The three are a closed set of token blocks.

---

## 2. Typography

| Role | Family | Rationale |
|---|---|---|
| Display / headings | **Plus Jakarta Sans** | Geometric-humanist, high x-height, reads as premium product typography without novelty. |
| Body / UI | **Inter** | The reference UI face: neutral, tuned for screens, excellent at small sizes. |
| Numerals / code | system mono | Tabular figures for finance tables. |

Two families only, both variable, both self-hosted at build time via `next/font`.

**Gradient text is retired** except for the wordmark. Headings are solid ink; emphasis
comes from weight, size and a single accent-coloured span — never a rainbow fill. This is
the single biggest cause of the "tiring to read" complaint.

Type scale is fluid (`clamp`) and defined once in the token layer.

---

## 3. Buttons — one system, per-theme treatment

Every button in the product comes from one component with a closed variant set:

| Variant | Light | Dark (both themes) |
|---|---|---|
| `primary` | Solid accent, white ink, soft accent shadow | Solid accent, ink darkened, subtle outer glow |
| `secondary` | Ink-filled, paper ink | Paper-filled, ink text |
| `outline` | Hairline border, transparent, tint on hover | Border at higher alpha, surface tint on hover |
| `ghost` | Transparent, tint on hover | Transparent, surface tint on hover |
| `soft` | Accent at 10%, accent ink | Accent at 18%, accent ink |
| `danger` | Solid danger | Solid danger |
| `link` | Underline on hover | Underline on hover |

Sizes: `sm` (36px) · `md` (42px) · `lg` (50px) · `icon`. Radius from `--radius-btn`,
themable. Focus ring is always visible and always 2px offset. No button anywhere in the
codebase may define its own colours.

---

## 4. Homepage rebuild

| Section | Behaviour |
|---|---|
| Announcement strip | CMS text, dismissible |
| **Hero** | Hand-built **global network** visualisation (SVG world graticule + animated connection arcs + pulsing nodes). Supports a **slider of 2–3 slides**, each with its own eyebrow, headline, subheadline, two CTAs and optional background image. Fully editable from Dashboard → Content → Homepage → Hero. Autoplay with pause on hover/focus, arrows, dots, keyboard support, `prefers-reduced-motion` honoured. |
| **Sponsors marquee** | Continuous marquee, direction (`left`/`right`) and speed set from the dashboard. Each item is an **image or a text wordmark**. Pauses on hover. Duplicated track for seamless loop; the duplicate is `aria-hidden`. |
| Capability rail | CMS |
| Services bento | CMS |
| Why HYASCKA | CMS |
| **Stats band** | Animated counters, CMS |
| Process timeline | CMS |
| Selected work | CMS |
| Industries | CMS |
| Testimonials | CMS |
| **FAQ — 20 questions in 2 columns/parts** | Part A "Working with us" (10), Part B "Delivery, pricing & support" (10). Accordion, one open at a time per column, `FAQPage` structured data. |
| Final CTA | CMS |

Every service detail page carries **at least 10 FAQ entries** of its own, seeded and
CMS-editable, emitted as `FAQPage` schema.

---

## 5. Navigation

- Compact bar: 64px tall, 12px vertical padding, tighter horizontal rhythm.
- On scroll it **shrinks to 56px** and gains a blurred, bordered surface — content never
  slides under transparent chrome.
- The page below is offset by the bar's height; nothing overlaps.
- Every link, dropdown trigger and CTA is keyboard-reachable and closes on `Escape`,
  outside click and route change.
- Mobile/tablet: full-height drawer, focus-trapped, body scroll locked, accordion
  sub-menus that actually open, and a visible close affordance.
- Breakpoints audited at 360 / 390 / 768 / 1024 / 1280 / 1536.

---

## 6. Dashboard

### 6.1 Sidebar
Redesigned as a proper application shell:
- **Top:** site logo + name.
- **Identity block:** avatar (or initials), full name, role badge, email.
- Grouped navigation with working, animated disclosure for Finance / Content / Settings.
- **Drawer on mobile and tablet**, collapsible rail on desktop; state persisted.
- Footer: view site, sign out.

### 6.2 Overview
Text KPIs **and** charts side by side — revenue trend, lead pipeline, invoice status
split, project progress. Charts are server-rendered SVG (no charting library in the
bundle), readable without colour, with a table view beneath.

### 6.3 Reports
Daily / weekly / monthly report generation for finance, leads, projects and clients,
exportable as **PDF and Excel (.xlsx)**.

### 6.4 Support tickets
- Any staff role can **create** a ticket (an internal token), not just clients.
- Tickets can be **assigned and reassigned** to any staff member.
- Assignment change notifies the new assignee and is audited.

### 6.5 Users & roles
Tabbed by role — All · Super Admin · Admin · Finance · PM · Editor · Support · Client —
with search inside each tab.

### 6.6 Integrations
Toggles persist and reflect real state; each integration states which env var backs it and
whether it is currently configured.

### 6.7 Media
Cloudinary upload from any editor. Documented limits: images ≤ 5 MB (JPG/PNG/WebP/AVIF/SVG),
documents ≤ 10 MB (PDF), recommended dimensions per slot shown inline in the UI.

### 6.8 Demo data
A seed that fills **every** dashboard surface — leads, clients, projects, tasks, invoices,
payments, expenses, transactions, refunds, conversations, tickets, notifications, media,
audit entries, sponsors, hero slides, FAQs. Everything is normal editable data: edit,
update and delete work exactly as on real records.

### 6.9 Notifications
The bell opens a dropdown with recent items, a live unread badge, "mark all read", and
per-item read-on-open. The badge clears without a reload.

---

## 7. New integrations

### 7.1 Contact form → dashboard + email
1. Submission persists as a `Lead` **before** anything external is attempted.
2. In-app notification to Super Admin/Admin, visible in the bell and on the Leads page.
3. **Resend** sends an alert to the team inbox and an acknowledgement to the sender.
4. Staff reply from the lead detail page; the reply is emailed and recorded on the thread.
5. If email fails, the lead is untouched and the failure is logged for retry.

### 7.2 WhatsApp widget
Floating button, number and greeting from settings, shown/hidden by a single toggle in
Dashboard → Settings → Features.

### 7.3 AI chat assistant (Google Gemini)
- `GEMINI_API_KEY` is server-side only; the browser never sees it.
- The assistant answers from a **public-data tool surface only**: published services,
  pricing, case studies, industries, FAQs, blog posts and public contact details.
- It has **no access** to users, leads, invoices, payments, messages, audit or settings.
  The retrieval layer is an allow-list, not a filter — private tables are unreachable by
  construction.
- Rate limited per IP; conversation stored per session for continuity only.
- Toggleable from Dashboard → Settings → Features.

---

## 8. Free-tier first, paid later

Every external dependency runs on a free tier for the first three months and is swapped by
changing one environment variable — never code:

| Capability | Free (months 1–3) | Paid path |
|---|---|---|
| Hosting | Vercel Hobby | Vercel Pro |
| Database | Neon free | Neon Scale |
| Media | Cloudinary free | Cloudinary Plus |
| Email | Resend free (3k/mo) | Resend Pro |
| AI | Gemini free tier | Gemini paid |
| Rate limit / cache | In-process → Upstash free | Upstash paid |
| Jobs | Inline → QStash free | QStash paid |
| Monitoring | Sentry free | Sentry Team |

`docs/ENV-SETUP.md` states, for every variable: what it is, where to get it, whether it is
required, and what happens when it is absent.

---

## 9. Security

- Deny-by-default routing; session re-resolved server-side on every request.
- Every Server Action: authenticate → authorise → validate (Zod) → verify ownership from
  the database → mutate → audit.
- **Public API allow-list.** Only `/api/system/status`, `/api/chat` and `/api/contact` are
  public. Everything else requires a session; anything data-bearing requires a permission.
- **Rate limiting** on login, registration, password reset, contact, chat, messaging and
  payment submission, with generic responses that leak nothing.
- Strict CSP, HSTS, frame/mime/referrer policy, permissions policy.
- Input hardening: body size caps, honeypots, schema validation before any query.
- No secret is ever rendered into a client bundle.

---

## 10. Performance & discoverability

- **Lighthouse ≥ 95** on mobile and desktop for `/`, `/services`, `/services/[slug]`,
  `/work`, `/blog`.
- Public pages SSG + ISR; the CMS revalidates on publish.
- Zero chart or animation libraries in the public bundle.
- Fonts self-hosted and preloaded; images responsive with explicit dimensions.
- **SEO** — unique metadata, canonicals, sitemap, robots, Open Graph.
- **GEO** (generative engine optimisation) — `Organization`, `Service`, `Article`,
  `BreadcrumbList`, `FAQPage` and `WebSite` structured data so answer engines can cite the
  site accurately.
- **AEO** (answer engine optimisation) — every service and FAQ answer is written as a
  self-contained, directly quotable response.

---

## 11. Styling discipline

All colour, spacing, radius, shadow, motion and type decisions live in `src/styles/`
as tokens and component layers. Page files carry layout utilities only. No page defines a
colour. This is what makes the three themes swap cleanly and keeps the design coherent.

---

## 12. Acceptance criteria

1. The site loads on Daylight; the navbar toggle switches themes without a flash.
2. Locking a single theme from the dashboard removes the toggle for visitors.
3. No heading anywhere uses gradient fill except the wordmark.
4. Every dashboard nav group, toggle, tab and button performs its action.
5. The notification bell opens, marks read and clears its badge without a reload.
6. Every dashboard list renders seeded rows; create/edit/delete work on them.
7. A contact submission appears in the dashboard **and** sends both emails.
8. The hero slider and sponsor marquee are fully editable from the dashboard.
9. The chat assistant answers from published content and refuses private data.
10. The homepage carries 20 FAQs; every service page carries at least 10.
11. Mobile and tablet navigation opens, traps focus and closes correctly.
12. Lighthouse ≥ 95 on mobile and desktop for the five key pages.
13. No non-public API route responds without a valid session.
