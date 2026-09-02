# Deployment & go-live checklist

## 1. Infrastructure

| Capability | Start on | Scale-up trigger |
|---|---|---|
| Hosting | Vercel free tier | Sustained traffic beyond the free function budget |
| Database | Neon free tier (pooled endpoint) | Connection usage consistently above 80% |
| Media | Cloudinary free tier | Monthly transformation quota exhausted |
| Email | Resend free tier or SMTP | Sending volume beyond the free allowance |
| Rate limiting / cache | Upstash Redis | Multi-region deployment, or command quota |
| Background jobs | Inline (default) → QStash / Inngest | Any job that must survive a cold start |
| Monitoring | Sentry free tier | Retention or seat limits reached |
| Alerting | Telegram bot + email | — |
| Uptime | UptimeRobot free tier | — |

## 2. Environment variables

Copy `.env.example` and fill in. Audit before the first production deploy:

- `DATABASE_URL` — the **pooled** Neon endpoint (contains `-pooler`).
- `DIRECT_URL` — the non-pooled endpoint, used only by `prisma migrate`.
- `AUTH_SECRET` — `openssl rand -base64 48`. Never reuse the development value.
- `NEXT_PUBLIC_SITE_URL` — the canonical production URL, no trailing slash.
- Everything else is optional; each adapter degrades safely when unset.

Only `NEXT_PUBLIC_*` values reach the browser. The Meta CAPI token, gateway credentials
and every API key stay server-side.

## 3. Database

```bash
npm run db:migrate            # in CI/production, not db:push
npm run db:seed               # first deploy only
```

Confirm Neon's point-in-time recovery window and write down the retention you are relying
on. Schedule a periodic export as a second safety net, independent of the provider.

## 4. Pipeline

CI must pass before a merge to the production branch:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:smoke            # against a preview deployment
```

Keep staging and production separate. Nothing goes live without a staging pass.

## 5. Go-live

- [ ] DNS cutover and SSL verified on the apex and `www`.
- [ ] `NEXT_PUBLIC_SITE_URL` matches the live domain (canonicals and sitemap depend on it).
- [ ] Every seeded password changed; the demo client accounts removed or disabled.
- [ ] Settings → SEO set to `index, follow`.
- [ ] Settings → Tracking IDs entered; consent banner verified to gate them.
- [ ] Settings → Payments: live credentials in, unused methods switched off.
- [ ] Placeholder case studies, testimonials and metrics replaced with real figures.
- [ ] Sentry receiving events, routed to Telegram or email — not just a dashboard.
- [ ] Uptime monitor pointed at `/` and `/api/system/status`.
- [ ] Rollback plan written down: previous deployment pinned, database backup taken.

## 6. Legal and data

- Cookie consent stores an actual choice; tracking waits for it. Verify in a private window.
- Publish the data-retention policy and the deletion-request process.
- Confirm the account-suspension workflow (non-destructive) for terms violations.

## 7. Testing targets

- 500–1000 concurrent users, validating pooling and indexing under load.
- Graceful degradation when Cloudinary, the payment gateway or the email provider is down.
- WCAG 2.1 AA verified, not assumed — keyboard paths, focus order, contrast, reduced motion.
- Lighthouse 90+ on `/`, `/services`, `/services/[slug]`, `/work` and `/blog`.

## 8. Maintenance windows

Use the two-stage system in Settings → Maintenance: publish the notice banner ahead of
time, then switch full maintenance mode on only when the work actually begins. Staff
sessions keep working throughout.
