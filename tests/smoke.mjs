/**
 * End-to-end smoke test (PRD §32).
 *
 * Covers the paths that must never break: the public site renders, a client can
 * sign in, a CLIENT session cannot reach an admin-only page, and the role's own
 * dashboard loads. Run against a built app:
 *
 *   npm run build && npm start &
 *   node tests/smoke.mjs [baseUrl]
 *
 * Note: login is rate limited (5 attempts per 5 minutes per email+IP), so a
 * rapid re-run can legitimately fail on the sign-in step. Restart the server to
 * clear the in-process limiter, or wait out the window.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const ADMIN = { email: "admin@hyascka.com", password: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe#2026" };
const CLIENT = { email: "client@northlane.example", password: ADMIN.password };

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

async function signIn(page, user) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#email", user.email);
  await page.fill("#password", user.password);
  await page.click('button[type="submit"]');
  // The action redirects via a soft navigation. The strict CSP blocks
  // page.waitForFunction (no unsafe-eval — by design), so poll from Node.
  await pollUntil(() => !new URL(page.url()).pathname.startsWith("/login"), 30000);
  await page.waitForSelector("h1", { timeout: 15000 });
}

async function pollUntil(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

try {
  // --- Public site ---------------------------------------------------------
  const anon = await browser.newContext();
  const page = await anon.newPage();

  for (const path of ["/", "/services", "/services/seo", "/work", "/pricing", "/blog", "/faq", "/contact", "/about"]) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    record(`public ${path}`, response?.status() === 200, `HTTP ${response?.status()}`);
  }

  // A logged-out visitor must never reach the dashboard.
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  record("logged-out /dashboard redirects to login", page.url().includes("/login"), page.url());
  await anon.close();

  // --- Client session ------------------------------------------------------
  const clientCtx = await browser.newContext();
  const clientPage = await clientCtx.newPage();
  await signIn(clientPage, CLIENT);
  record("client can sign in", clientPage.url().includes("/dashboard"), clientPage.url());

  await clientPage.goto(`${BASE}/dashboard/my-invoices`, { waitUntil: "domcontentloaded" });
  await clientPage.waitForSelector("h1", { timeout: 15000 });
  record(
    "client sees own invoices",
    (await clientPage.locator("h1").first().textContent())?.includes("Invoices") ?? false,
  );

  // Privilege escalation: a CLIENT must not reach staff-only modules, even by
  // typing the URL directly (PRD §33, §41.4).
  for (const path of ["/dashboard/finance/invoices", "/dashboard/users", "/dashboard/leads", "/dashboard/audit"]) {
    await clientPage.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    // The guard redirects during render; wait for the router to settle.
    await pollUntil(() => clientPage.url().includes("denied=1"), 15000);
    record(`client blocked from ${path}`, clientPage.url().includes("denied=1"), clientPage.url());
  }
  await clientCtx.close();

  // --- Super admin session -------------------------------------------------
  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await signIn(adminPage, ADMIN);
  record("super admin can sign in", adminPage.url().includes("/dashboard"), adminPage.url());

  for (const path of [
    "/dashboard",
    "/dashboard/leads",
    "/dashboard/clients",
    "/dashboard/projects",
    "/dashboard/finance/invoices",
    "/dashboard/finance/payments",
    "/dashboard/finance/reports",
    "/dashboard/content/homepage",
    "/dashboard/settings",
    "/dashboard/settings/payments",
    "/dashboard/users",
    "/dashboard/audit",
  ]) {
    const response = await adminPage.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    const ok = response?.status() === 200 && !adminPage.url().includes("denied=1");
    record(`admin ${path}`, ok, `HTTP ${response?.status()}`);
  }
  await adminCtx.close();
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
