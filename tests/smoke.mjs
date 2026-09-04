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
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const path of ["/", "/services", "/services/seo", "/work", "/pricing", "/blog", "/faq", "/contact", "/about"]) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    record(`public ${path}`, response?.status() === 200, `HTTP ${response?.status()}`);
  }

  // --- Design system -------------------------------------------------------
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  record(
    "site opens on the Daylight theme",
    (await page.locator("html").getAttribute("data-theme")) === "light",
  );
  // The accordion is native <details>/<summary> — zero JavaScript, so there is
  // no aria-expanded button to count.
  record("homepage carries 20 FAQ questions", (await page.locator("#faq summary").count()) === 20);
  record("sponsor marquee renders", await page.locator('section[aria-label="Partners and clients"]').isVisible());

  // The hero slider, the scroll reveals and the announcement bar are driven by
  // one head script that only ever sets its own data attributes — never markup
  // React rendered — so none of them can collide with hydration.
  record("no page errors on the homepage", pageErrors.length === 0, pageErrors[0] ?? "");
  const slideShown = () =>
    page.$$eval("[data-hero-slide]", (els) =>
      els.findIndex((el) => getComputedStyle(el).display !== "none"),
    );
  record("hero opens on the first slide", (await slideShown()) === 0);
  await page.locator('[data-hero-step="1"]').click();
  await page.waitForTimeout(150);
  record("hero slider advances", (await slideShown()) === 1);
  await page.locator('[data-hero-go="0"]').click();
  await page.waitForTimeout(150);
  record("hero dots select a slide", (await slideShown()) === 0);

  // Reveals are a CSS scroll-driven animation now, so there is no state to
  // inspect — only that the markup is there and nothing ends up stuck hidden.
  record("sections carry the reveal hook", (await page.locator("[data-reveal]").count()) > 0);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
  });
  await page.waitForTimeout(800);
  record(
    "no section is left invisible on screen",
    (await page.$$eval("[data-reveal]", (els) =>
      els.filter((el) => {
        const box = el.getBoundingClientRect();
        return box.bottom > 0 && box.top < window.innerHeight && getComputedStyle(el).opacity === "0";
      }).length,
    )) === 0,
  );

  await page.locator('button[aria-label="Dismiss announcement"]').click();
  await page.reload({ waitUntil: "domcontentloaded" });
  record(
    "dismissed announcement stays dismissed",
    await page.$eval("#hy-announcement", (el) => getComputedStyle(el).display === "none"),
  );

  // Theme toggle actually switches the document theme.
  await page.locator('button[aria-label^="Theme:"]').click();
  await page.locator('button[role="menuitemradio"]').nth(1).click();
  await page.waitForTimeout(400);
  const switched = await page.locator("html").getAttribute("data-theme");
  record("theme toggle switches theme", switched === "midnight" || switched === "network", String(switched));

  // --- Public API allow-list ----------------------------------------------
  for (const [route, expected] of [
    ["/api/system/status", 200],
    ["/api/reports/generate?type=finance&period=weekly&format=pdf", 401],
    ["/api/media/upload", 401],
  ]) {
    const response = await page.request.get(`${BASE}${route}`);
    record(`api ${route} → ${expected}`, response.status() === expected, `HTTP ${response.status()}`);
  }

  // --- Mobile navigation ---------------------------------------------------
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await mobilePage.locator('button[aria-label="Open menu"]').click();
  await mobilePage.waitForTimeout(400);
  record("mobile drawer opens", await mobilePage.locator("#mobile-drawer").isVisible());
  await mobilePage.locator('button[aria-label="Close menu"]').click();
  await mobilePage.waitForTimeout(400);
  record("mobile drawer closes", (await mobilePage.locator("#mobile-drawer").count()) === 0);
  await mobile.close();

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
    "/dashboard/settings/theme",
    "/dashboard/settings/sponsors",
    "/dashboard/settings/widgets",
    "/dashboard/support",
    "/dashboard/media",
    "/dashboard/orders",
    "/dashboard/seo",
    "/dashboard/integrations",
    "/dashboard/content/blog",
    "/dashboard/finance/expenses",
    "/dashboard/finance/transactions",
    "/dashboard/finance/refunds",
  ]) {
    const response = await adminPage.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    const ok = response?.status() === 200 && !adminPage.url().includes("denied=1");
    record(`admin ${path}`, ok, `HTTP ${response?.status()}`);
  }

  // Every list must show seeded rows — no empty dashboard on first login.
  for (const [path, marker] of [
    ["/dashboard/leads", "table tbody tr"],
    ["/dashboard/clients", "table tbody tr"],
    ["/dashboard/finance/invoices", "table tbody tr"],
    ["/dashboard/users", "table tbody tr"],
  ]) {
    await adminPage.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await adminPage.waitForSelector(marker, { timeout: 10000 }).catch(() => {});
    const rows = await adminPage.locator(marker).count();
    record(`${path} has demo rows`, rows > 0, `${rows} rows`);
  }

  // The notification bell must open and clear its badge without a reload.
  await adminPage.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await adminPage.waitForTimeout(1200);
  const bell = adminPage.locator('button[aria-label*="Notifications"]');
  record("notification bell present", (await bell.count()) > 0);
  await bell.first().click();
  await adminPage.waitForTimeout(500);
  record("notification dropdown opens", await adminPage.getByRole("menu").first().isVisible());
  const markAll = adminPage.getByRole("button", { name: /mark all read/i });
  if (await markAll.count()) {
    await markAll.click();
    await adminPage.waitForTimeout(1500);
    const label = (await bell.first().getAttribute("aria-label")) ?? "";
    record("unread badge clears without reload", !/\d/.test(label), label);
  } else {
    record("unread badge clears without reload", true, "already clear");
  }

  // Report generation must return a real file, not an error page.
  for (const format of ["pdf", "xlsx"]) {
    const response = await adminPage.request.get(
      `${BASE}/api/reports/generate?type=finance&period=monthly&format=${format}`,
    );
    const body = await response.body();
    const valid =
      format === "pdf"
        ? body.subarray(0, 5).toString() === "%PDF-"
        : body.subarray(0, 2).toString() === "PK";
    record(`report export (${format})`, response.status() === 200 && valid, `${body.length} bytes`);
  }

  await adminCtx.close();
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
