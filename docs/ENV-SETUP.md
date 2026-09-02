# Environment setup

Everything the site needs to run, what happens if you leave each value empty,
and exactly where to get it.

You do **not** need all of this to start. Only the first section — Core,
Database and Auth — is required. Everything else is optional: the feature it
powers stays switched off until you fill it in, and nothing else breaks.

---

## 1. Install and first run

Requirements: **Node.js 20 or newer** and a PostgreSQL database. Check with
`node -v`. If you need Node, install it from <https://nodejs.org> (take the LTS
build).

```bash
npm install                 # install dependencies
cp .env.example .env.local  # runtime configuration
cp .env.example .env        # same values again, for the Prisma CLI
# → open both files and fill in DATABASE_URL, DIRECT_URL and AUTH_SECRET
npm run db:push             # create the tables
npm run db:seed             # content, settings and demo data
npm run dev                 # http://localhost:3000
```

Two env files is not a mistake: Next.js reads `.env.local` at runtime, while
the Prisma command-line tool reads `.env`. Keep them identical.

Sign in at `/login` with the seeded owner account — `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` from your env file. **Change that password before the
site goes live.**

For production:

```bash
npm run build
npm start
```

Other commands: `npm run lint`, `npm run typecheck`, `node tests/smoke.mjs
http://localhost:3000` (end-to-end checks), `npm run db:studio` (browse the
database).

---

## 2. Required

### `NEXT_PUBLIC_SITE_URL`

Your public address — `https://hyascka.com` in production,
`http://localhost:3000` locally. Canonical URLs, the sitemap, Open Graph tags
and links inside emails are all built from it, so a wrong value here shows up
in Google and in your customers' inboxes. No trailing slash.

### `DATABASE_URL` and `DIRECT_URL`

Where to get them: **Neon** — <https://neon.tech> — has a free tier that suits
this site. Sign up, create a project, and on the project dashboard open
*Connection Details*.

- `DATABASE_URL` is the **Pooled connection** string. Its host contains
  `-pooler`. The running site uses it.
- `DIRECT_URL` is the same string with `-pooler` removed. Schema changes
  (`db:push`, migrations) use it, because they cannot run through a pooler.

Both must end with `?sslmode=require`. Any other PostgreSQL host works too
(Supabase, Railway, your own server); if it has no pooler, put the same string
in both.

### `AUTH_SECRET`

The key that signs session cookies. Generate a fresh one:

```bash
openssl rand -base64 48
```

Anyone holding this value can forge a login, so it is never committed and never
shared. Changing it signs everyone out, which is exactly what you want if it
ever leaks. Use a different secret in production than in development.

### `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`

Only used by `npm run db:seed`, to create the first owner account. Set them to
something you control before seeding.

---

## 3. Optional — turn on as you need them

Every item below is off until you fill it in. The column that matters most is
"if you leave it empty", so you can start free and add paid services later.

### Email — Resend

| | |
|---|---|
| Variables | `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY` |
| If empty | `EMAIL_PROVIDER="console"` prints emails to your terminal instead of sending them. Contact forms still reach the dashboard; only the email copy is missing. |
| Free tier | 3,000 emails a month, 100 a day |

1. Sign up at <https://resend.com>.
2. **Domains → Add Domain**, enter `hyascka.com`, and add the DNS records it
   shows you (SPF, DKIM and a return-path record) at your domain registrar.
   Wait for the status to turn *Verified* — until it does, delivery to Gmail
   and Outlook will land in spam.
3. **API Keys → Create API Key**, permission *Sending access*. Copy it once —
   it is shown only at creation.
4. Set `RESEND_API_KEY` to that key, `EMAIL_PROVIDER="resend"`, and
   `EMAIL_FROM` to an address at the domain you verified, e.g.
   `HYASCKA <hello@hyascka.com>`. Sending from a domain you have not verified
   is the single most common cause of "the email never arrived".

### AI assistant — Google Gemini

| | |
|---|---|
| Variables | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| If empty | The chat widget does not appear and `/api/chat` returns 503. |
| Free tier | Yes, with per-minute limits |

1. Go to <https://aistudio.google.com/apikey> and sign in with a Google
   account.
2. **Create API key**, choose a Google Cloud project (or let it make one).
3. Copy the key into `GEMINI_API_KEY`.
4. Leave `GEMINI_MODEL="gemini-2.0-flash"` unless you have a reason to change
   it. Flash is the fast, inexpensive model and is the right default for a
   support chat.

The assistant is given a knowledge pack assembled from **published** services,
FAQs, case studies, industries, blog posts and your public contact details, and
nothing else. It has no access to accounts, invoices, payments, projects or any
customer record — not because those are filtered out, but because they are
never fetched.

### Image and file uploads — Cloudinary

| | |
|---|---|
| Variables | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| If empty | Uploads still work, but the file is stored inline in the database and anything over 512 KB is refused with a message telling the editor to add the Cloudinary keys. Fine for trying things out; not how you want to run a live site. |
| Free tier | 25 GB storage and 25 GB monthly bandwidth |

1. Sign up at <https://cloudinary.com>.
2. The **Dashboard** shows *Cloud name*, *API Key* and *API Secret* — copy all
   three (reveal the secret with the eye icon).
3. Paste them into the three variables. There is no switch to flip: the moment
   all three are present, uploads go to Cloudinary.

Uploads are signed on the server, so the API secret never reaches the browser.
`STORAGE_PROVIDER` and `CLOUDINARY_UPLOAD_PRESET` in the template are unused —
leave them as they are.

**Size limits, so an editor knows before they try:**

| What | Limit | Recommended size |
|---|---|---|
| Images (JPG, PNG, WebP, AVIF, SVG) | 5 MB | see below |
| Documents (PDF) | 10 MB | — |

| Slot | Pixels |
|---|---|
| Hero slide | 1600 × 1200, landscape |
| Sponsor logo | 320 × 80, transparent PNG or SVG |
| Service / case study / blog cover | 1200 × 675 (16:9) |
| Avatar | 400 × 400, square |
| Social share image | 1200 × 630 |
| Logo | 512 × 512, transparent |

The dashboard shows the same numbers next to each upload field, so nobody has
to read this file to add a picture.

### Rate limiting across instances — Upstash Redis

| | |
|---|---|
| Variables | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| If empty | Rate limiting still works, but each server instance counts on its own. Correct for one instance; on several, the effective limit multiplies. |
| Free tier | 10,000 commands a day |

1. Sign up at <https://upstash.com> and create a Redis database (pick the
   region closest to your hosting).
2. On the database page, the **REST API** section shows
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Copy both.

Add this when you scale past a single instance, not before.

### Internal alerts — Telegram

| | |
|---|---|
| Variables | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| If empty | No Telegram alerts. Dashboard notifications are unaffected. |
| Cost | Free |

1. In Telegram, message [@BotFather](https://t.me/BotFather), send
   `/newbot`, and follow the prompts. It replies with the token.
2. Create a group for alerts, add your bot to it, and send any message.
3. Open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser and
   read `result[0].message.chat.id` — that is `TELEGRAM_CHAT_ID`. Group ids
   start with a minus sign; keep it.

### Conversion tracking — Meta

| | |
|---|---|
| Variables | `META_CAPI_ACCESS_TOKEN`, `META_CAPI_DATASET_ID` |
| If empty | Browser-side pixels still fire if you set their IDs in the dashboard; only the server-side copy is missing. |

From **Meta Events Manager** → your dataset → *Settings* → *Conversions API* →
*Generate access token*. The dataset ID is the number at the top of the same
page. Public pixel IDs (GA4, GTM, Clarity, Meta) are **not** environment
variables — an admin enters them in *Dashboard → Integrations*.

### Error monitoring — Sentry

`SENTRY_DSN`. From <https://sentry.io> → *Projects → your project → Settings →
Client Keys (DSN)*. Free tier: 5,000 errors a month.

### Reserved

`SSLCOMMERZ_*`, `SMTP_*`, `QSTASH_*`, `JOBS_PROVIDER` and `JOB_WEBHOOK_SECRET`
are placeholders for adapters that exist in the code but are not yet wired to a
live provider. Leaving them empty changes nothing today. `SESSION_MAX_AGE_DAYS`
(default 7) controls how long a login lasts.

---

## 4. Free for the first three months, paid later

Nothing here needs a paid plan to launch:

| Service | Free tier | When you outgrow it |
|---|---|---|
| Neon (database) | 0.5 GB storage | ~$19/month |
| Vercel (hosting) | Hobby | $20/month per member for Pro |
| Resend (email) | 3,000/month | $20/month for 50,000 |
| Cloudinary (media) | 25 GB | $89/month |
| Gemini (AI) | Rate-limited free tier | Pay per request |
| Upstash (Redis) | 10,000 commands/day | Pay per request |
| Sentry (errors) | 5,000 events/month | $26/month |

Moving to a paid plan is a billing change on the provider's side. No code
changes, no redeployment — the keys stay the same.

---

## 5. Deploying

Set the same variables in your host's dashboard rather than uploading a file.
On **Vercel**: *Project → Settings → Environment Variables*, add each one, pick
*Production* (and *Preview* if you use preview deployments), then redeploy —
existing deployments do not pick up new values.

Two things to change for production:

- `NEXT_PUBLIC_SITE_URL` → your real domain.
- `AUTH_SECRET` → a different secret from the one you use locally.

---

## 6. When something does not work

**"Can't reach database server"** — `DATABASE_URL` is wrong or missing
`?sslmode=require`. Check you copied the **pooled** string into `DATABASE_URL`
and the non-pooled one into `DIRECT_URL`.

**Signed out immediately after logging in** — `AUTH_SECRET` changed, or differs
between your local and deployed environments.

**Contact form arrives in the dashboard but not by email** — `EMAIL_PROVIDER`
is still `console`, `RESEND_API_KEY` is empty, or `EMAIL_FROM` uses a domain
that is not verified in Resend.

**Chat widget missing** — `GEMINI_API_KEY` is empty, or the assistant is
switched off in *Dashboard → Settings → Widgets*.

**"Only files under 512 KB can be stored"** — the three `CLOUDINARY_*`
variables are not all filled in, so uploads are falling back to inline storage.

**"Too many requests" while testing login** — five attempts per five minutes per
email and IP address. Wait it out, or restart the server to clear the in-memory
counter.
