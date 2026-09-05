/**
 * Client service lifecycle — the four links that tie a request, a ticket and an
 * invoice together (PRD §43, §50).
 *
 *   1. An admin can raise a custom request against a client, and that client
 *      sees it in their own portal.
 *   2. A client can raise a support ticket about one delivered service, and the
 *      staff view of that request shows it.
 *   3. An invoice line can name a service, and the client's invoice shows it.
 *   4. The client can download their invoice as a PDF, and nobody else can.
 *
 * Run against a built app:  npm run build && npm start &  then
 *   CHROMIUM_PATH=… node tests/lifecycle.mjs [baseUrl]
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe#2026";
const ADMIN = { email: "admin@hyascka.com", password: PASSWORD };
const CLIENT = { email: "client@northlane.example", password: PASSWORD };

const stamp = Date.now();
const REQUEST_TITLE = `Checkout rebuild ${stamp}`;
const TICKET_SUBJECT = `Login broken after release ${stamp}`;

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

async function pollUntil(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

async function signIn(page, user) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#email", user.email);
  await page.fill("#password", user.password);
  await page.click('button[type="submit"]');
  const signedIn = await pollUntil(
    async () => !new URL(page.url()).pathname.startsWith("/login"),
    30000,
  );
  if (!signedIn) {
    const reason = await page.innerText("[role=alert]").catch(() => "no reason given");
    throw new Error(`Could not sign in as ${user.email}: ${reason}`);
  }
  await page.waitForSelector("h1", { timeout: 15000 });
}

/**
 * The rendered text of a page.
 *
 * `page.content()` escapes ampersands (a service called "AI & Business
 * Automation" comes back as "AI &amp; …") and `innerText` omits parts of the
 * dashboard shell, so neither is safe to assert on. textContent is both
 * complete and unescaped.
 */
const bodyText = (page) => page.$eval("body", (node) => node.textContent ?? "");

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

try {
  // --- 1. Admin raises a custom request -----------------------------------
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, ADMIN);

  await admin.goto(`${BASE}/dashboard/requests`, { waitUntil: "domcontentloaded" });
  await admin.click('button:has-text("New request for a client")');
  await admin.waitForSelector("#cr-client", { timeout: 10000 });

  const clientOptions = await admin.$$eval("#cr-client option", (nodes) =>
    nodes.map((node) => ({ value: node.value, label: node.textContent?.trim() })).filter((o) => o.value),
  );
  const northlane =
    clientOptions.find((option) => /northlane/i.test(option.label ?? "")) ?? clientOptions[0];
  await admin.selectOption("#cr-client", northlane.value);

  const serviceOptions = await admin.$$eval("#cr-service option", (nodes) =>
    nodes.map((node) => ({ value: node.value, label: node.textContent?.trim() })).filter((o) => o.value),
  );
  const service = serviceOptions[0];
  await admin.selectOption("#cr-service", service.value);
  await admin.fill("#cr-title", REQUEST_TITLE);
  await admin.fill("#cr-brief", "Rebuild the checkout with saved cards and a one-page flow.");
  await admin.fill("#cr-budget", "$4,200");
  await admin.click('form:has(#cr-title) button[type="submit"]');

  const created = await pollUntil(async () => {
    await admin.goto(`${BASE}/dashboard/requests`, { waitUntil: "domcontentloaded" });
    return (await bodyText(admin)).includes(REQUEST_TITLE);
  }, 20000);
  record("admin creates a custom request for a client", created, created ? REQUEST_TITLE : "not listed");

  const requestHref = await admin.getAttribute(`a:has-text("${REQUEST_TITLE}")`, "href");
  record("custom request has a staff detail page", Boolean(requestHref), requestHref ?? "no link");

  // --- 2. The client sees it, and raises a ticket about it ----------------
  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  await signIn(client, CLIENT);

  await client.goto(`${BASE}/dashboard/my-services`, { waitUntil: "domcontentloaded" });
  const clientSees = (await bodyText(client)).includes(REQUEST_TITLE);
  record("client sees the custom request in their portal", clientSees);

  const serviceHref = await client.getAttribute(`a:has-text("${REQUEST_TITLE}")`, "href");
  if (serviceHref) {
    await client.goto(`${BASE}${serviceHref}`, { waitUntil: "domcontentloaded" });
    const hasTicketForm = await client.$('input[name="subject"]');
    record("client service page offers a ticket about this service", Boolean(hasTicketForm));

    if (hasTicketForm) {
      const ticketForm = client.locator('form:has(input[name="subject"])');
      await ticketForm.locator('input[name="subject"]').fill(TICKET_SUBJECT);
      await ticketForm
        .locator('textarea[name="body"]')
        .fill("Two of our team cannot sign in since the release this morning.");
      await ticketForm.locator('button[type="submit"]').click();
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const linked = await pollUntil(async () => {
        await admin.goto(`${BASE}${requestHref}`, { waitUntil: "domcontentloaded" });
        return (await bodyText(admin)).includes(TICKET_SUBJECT);
      }, 20000);
      record("ticket raised from a service shows on the staff request page", linked);
    }
  } else {
    record("client service page offers a ticket about this service", false, "no service link");
    record("ticket raised from a service shows on the staff request page", false, "skipped");
  }

  // --- 3. An invoice line names a service ---------------------------------
  await admin.goto(`${BASE}/dashboard/finance/invoices/new`, { waitUntil: "domcontentloaded" });
  await admin.waitForSelector("#service-0", { timeout: 10000 });
  await admin.selectOption("#clientId", northlane.value);
  const invoiceService = await admin.$$eval("#service-0 option", (nodes) =>
    nodes.map((node) => ({ value: node.value, label: node.textContent?.trim() })).filter((o) => o.value),
  );
  record("invoice line offers a service picker", invoiceService.length > 0, `${invoiceService.length} services`);
  await admin.selectOption("#service-0", invoiceService[0].value);
  await admin.fill(`#desc-0`, `Retainer ${stamp}`);
  await admin.fill(`#price-0`, "1200");
  await admin.click('button:has-text("Issue invoice")');

  const onInvoice = await pollUntil(
    async () => {
      const path = new URL(admin.url()).pathname;
      return path.startsWith("/dashboard/finance/invoices/") && !path.endsWith("/new");
    },
    25000,
  );
  record(
    "invoice issues with a service on the line",
    onInvoice,
    onInvoice ? admin.url() : (await admin.textContent("[role=alert]").catch(() => null)) ?? admin.url(),
  );

  let invoiceId = null;
  if (onInvoice) {
    invoiceId = new URL(admin.url()).pathname.split("/").pop();
    await admin.waitForSelector("h1", { timeout: 10000 });
    const staffBody = await bodyText(admin);
    record(
      "staff invoice names the service",
      staffBody.includes(invoiceService[0].label ?? "—"),
      invoiceService[0].label,
    );

    // --- 4. Download, and only by the right people ------------------------
    const owner = await clientContext.request.get(`${BASE}/api/invoices/${invoiceId}/pdf`);
    const body = await owner.body();
    record(
      "client downloads their invoice PDF",
      owner.status() === 200 &&
        owner.headers()["content-type"]?.includes("application/pdf") &&
        body.subarray(0, 4).toString() === "%PDF",
      `HTTP ${owner.status()}, ${body.length} bytes`,
    );

    const anon = await browser.newContext();
    const stranger = await anon.request.get(`${BASE}/api/invoices/${invoiceId}/pdf`);
    record("a signed-out visitor cannot download it", stranger.status() === 401, `HTTP ${stranger.status()}`);
    await anon.close();

    await client.goto(`${BASE}/dashboard/my-invoices/${invoiceId}`, { waitUntil: "domcontentloaded" });
    record(
      "client invoice page names the service",
      (await bodyText(client)).includes(invoiceService[0].label ?? "—"),
    );
    record(
      "client invoice page offers the download",
      (await client.content()).includes(`/api/invoices/${invoiceId}/pdf`),
    );
  }
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
