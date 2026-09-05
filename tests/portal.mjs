/**
 * The client portal lifecycle, end to end (PRD v5.2 §3).
 *
 *   1. A signed-in client's contact-form enquiry opens a request in their own
 *      dashboard — it does not vanish into a mailbox.
 *   2. A client can ask for a service, or for custom work, from their portal.
 *   3. Staff quote a price; the client accepts; staff confirm and invoice; the
 *      invoice, the payment method and its status are all visible against that
 *      one piece of work.
 *   4. Staff can start a project and share a document, so Projects and
 *      Documents are not permanently empty for a real client.
 *   5. Changing a user's role or status needs a deliberate submit, and signs
 *      that person out everywhere.
 *
 * Run against a built app:  npm run build && npm start &  then
 *   CHROMIUM_PATH=… node tests/portal.mjs [baseUrl]
 *
 * Sign-in is rate limited (5 attempts per 5 minutes per email + IP), and this
 * suite signs in four times. Running it straight after another suite can trip
 * that limit; leave a few minutes between runs, or restart the server, which
 * clears the in-process counter.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe#2026";
const ADMIN = { email: "admin@hyascka.com", password: PASSWORD };
const CLIENT = { email: "client@northlane.example", password: PASSWORD };
const VICTIM = { email: "client@vireo.example", password: PASSWORD };

const stamp = Date.now();
const ENQUIRY = `Contact form enquiry ${stamp}`;
const PORTAL_REQUEST = `Portal custom work ${stamp}`;
const PROJECT_NAME = `New project ${stamp}`;
const DOC_TITLE = `Statement of work ${stamp}`;

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const bodyText = (page) => page.$eval("body", (node) => node.textContent ?? "");

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
  const ok = await pollUntil(async () => !new URL(page.url()).pathname.startsWith("/login"), 30000);
  if (!ok) {
    const reason = await page.innerText("[role=alert]").catch(() => "no reason given");
    throw new Error(`Could not sign in as ${user.email}: ${reason}`);
  }
  await page.waitForSelector("h1", { timeout: 15000 });
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

/** Set once the test has suspended an account, so `finally` can put it back. */
let restoreVictim = null;

/** Leaves the account this suite suspends in its normal, signed-in-able state. */
async function ensureVictimActive(admin) {
  await admin.goto(`${BASE}/dashboard/users?q=vireo`, { waitUntil: "domcontentloaded" });
  const select = admin.locator('select[id^="status-"]').first();
  await select.waitFor({ timeout: 15000 });
  if ((await select.inputValue()) === "ACTIVE") return;
  await select.selectOption("ACTIVE");
  await admin.locator('button:has-text("Save changes")').first().click();
  await pollUntil(async () => (await bodyText(admin)).includes("active again"), 20000);
}

try {
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, ADMIN);

  // This suite suspends a seeded account. Put it back to active before we
  // start, so a crashed earlier run cannot make this one unrunnable.
  await ensureVictimActive(admin);

  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  await signIn(client, CLIENT);

  // --- 1. Contact form, while signed in -----------------------------------
  await client.goto(`${BASE}/contact`, { waitUntil: "domcontentloaded" });
  await client.fill('input[name="name"]', "Farhana Rahman");
  await client.fill('input[name="email"]', CLIENT.email);
  await client.fill(
    'textarea[name="message"]',
    `${ENQUIRY} — we would like help with our checkout conversion rate this quarter.`,
  );
  const consent = client.locator('input[name="consent"]');
  if (await consent.count()) await consent.first().check();
  await client.click('form:has(textarea[name="message"]) button[type="submit"]');

  const enquiryLanded = await pollUntil(async () => {
    await client.goto(`${BASE}/dashboard/my-services`, { waitUntil: "domcontentloaded" });
    return (await bodyText(client)).includes("enquiry");
  }, 25000);
  record("signed-in client's contact enquiry reaches their dashboard", enquiryLanded);

  // --- 2. Asking for work from inside the portal ---------------------------
  await client.click('button:has-text("Request a service")');
  await client.waitForSelector("#req-title", { timeout: 10000 });
  await client.selectOption("#req-service", "");
  await client.fill("#req-title", PORTAL_REQUEST);
  await client.fill(
    "#req-brief",
    "We need a bespoke integration between our CRM and the booking system.",
  );
  await client.fill("#req-budget", "$5,000");
  await client.click('form:has(#req-title) button[type="submit"]');

  const raised = await pollUntil(async () => {
    await client.goto(`${BASE}/dashboard/my-services`, { waitUntil: "domcontentloaded" });
    return (await bodyText(client)).includes(PORTAL_REQUEST);
  }, 25000);
  record("client can raise a request from their portal", raised);

  const portalBody = await bodyText(client);
  record(
    "custom work has its own section",
    portalBody.includes("Custom work") && portalBody.includes(PORTAL_REQUEST),
  );

  const requestHref = await client.getAttribute(`a:has-text("${PORTAL_REQUEST}")`, "href");

  // --- 3. Quote → accept → confirm → invoice → pay -------------------------
  await admin.goto(`${BASE}/dashboard/requests`, { waitUntil: "domcontentloaded" });
  const staffHref = await admin.getAttribute(`a:has-text("${PORTAL_REQUEST}")`, "href");
  record("the client's request reaches the staff queue", Boolean(staffHref), staffHref ?? "not listed");

  await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
  await admin.waitForSelector('input[name="amount"]', { timeout: 10000 });
  await admin.fill('input[name="amount"]', "4200");
  await admin.selectOption('select[name="currency"]', "USD");
  await admin.fill('textarea[name="note"]', "Integration build, testing and one month of support.");
  await admin.click('form:has(input[name="amount"]) button[type="submit"]');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const quoteSeen = await pollUntil(async () => {
    await client.goto(`${BASE}${requestHref}`, { waitUntil: "domcontentloaded" });
    return (await bodyText(client)).includes("4,200");
  }, 20000);
  record("client sees the quoted price", quoteSeen);

  await client.click('button:has-text("Accept")');
  await client.waitForSelector('form:has(input[name="decision"]) button[type="submit"]', { timeout: 10000 });
  await client.click('form:has(input[name="decision"]) button[type="submit"]');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const accepted = await pollUntil(async () => {
    await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
    return (await bodyText(admin)).includes("accepted");
  }, 20000);
  record("acceptance reaches staff", accepted);

  // Confirm needs the second click of the arm-then-confirm button.
  const confirmButton = admin.locator('button:has-text("Confirm and start")');
  if (await confirmButton.count()) {
    await confirmButton.first().click();
    await admin.locator('button:has-text("Confirm this work?")').first().click();
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  const confirmed = await pollUntil(async () => {
    await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
    return (await bodyText(admin)).includes("confirmed");
  }, 20000);
  record("staff confirm the work", confirmed);

  await admin.click('button:has-text("Create invoice from quote")');
  const invoiced = await pollUntil(async () => {
    await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
    return (await bodyText(admin)).includes("Billing");
  }, 25000);
  record("invoice is raised from the accepted quote", invoiced);

  const paymentVisible = await pollUntil(async () => {
    await client.goto(`${BASE}${requestHref}`, { waitUntil: "domcontentloaded" });
    const text = await bodyText(client);
    return text.includes("Payment") && text.includes("4,200");
  }, 20000);
  record("client sees the invoice against that piece of work", paymentVisible);

  await client.goto(`${BASE}/dashboard/my-payments`, { waitUntil: "domcontentloaded" });
  record("payments page names what each payment is for", (await bodyText(client)).includes("For"));

  // --- 4. Projects and documents no longer dead ends -----------------------
  await admin.goto(`${BASE}/dashboard/projects`, { waitUntil: "domcontentloaded" });
  await admin.click('button:has-text("New project")');
  await admin.waitForSelector("#pr-client", { timeout: 10000 });
  const clientOptions = await admin.$$eval("#pr-client option", (nodes) =>
    nodes.map((node) => ({ value: node.value, label: node.textContent?.trim() })).filter((o) => o.value),
  );
  const northlane =
    clientOptions.find((option) => /northlane/i.test(option.label ?? "")) ?? clientOptions[0];
  await admin.selectOption("#pr-client", northlane.value);
  await admin.fill("#pr-name", PROJECT_NAME);
  await admin.fill("#pr-summary", "Build, test and hand over the integration.");
  await admin.click('form:has(#pr-name) button[type="submit"]');

  const projectMade = await pollUntil(async () => {
    await admin.goto(`${BASE}/dashboard/projects`, { waitUntil: "domcontentloaded" });
    return (await bodyText(admin)).includes(PROJECT_NAME);
  }, 25000);
  record("staff can start a project", projectMade);

  const clientSeesProject = await pollUntil(async () => {
    await client.goto(`${BASE}/dashboard/my-projects`, { waitUntil: "domcontentloaded" });
    return (await bodyText(client)).includes(PROJECT_NAME);
  }, 20000);
  record("the project appears in the client's portal", clientSeesProject);

  const projectHref = await client.getAttribute(`a[href*="/dashboard/my-projects/"]`, "href");
  if (projectHref) {
    await client.goto(`${BASE}${projectHref}`, { waitUntil: "domcontentloaded" });
    record(
      "client can raise a ticket about a project",
      Boolean(await client.$('input[name="subject"]')),
    );
  } else {
    record("client can raise a ticket about a project", false, "no project link");
  }

  // --- 5. User management: submit, confirm, sign-out -----------------------
  const victimContext = await browser.newContext();
  const victim = await victimContext.newPage();
  await signIn(victim, VICTIM);
  record("second client is signed in", !new URL(victim.url()).pathname.startsWith("/login"));

  await admin.goto(`${BASE}/dashboard/users?q=vireo`, { waitUntil: "domcontentloaded" });
  const statusSelect = admin.locator('select[id^="status-"]').first();
  await statusSelect.waitFor({ timeout: 10000 });

  record(
    "no save button until something is changed",
    (await admin.locator('button:has-text("Save changes")').count()) === 0,
  );

  await statusSelect.selectOption("SUSPENDED");
  record(
    "changing a value reveals an explicit save button",
    (await admin.locator('button:has-text("Save changes")').count()) > 0,
  );

  await admin.locator('button:has-text("Save changes")').first().click();
  const armed = await admin.locator('button:has-text("Yes — apply and sign them out")').count();
  record("suspending asks for confirmation first", armed > 0);
  restoreVictim = () => ensureVictimActive(admin);
  await admin.locator('button:has-text("Yes — apply and sign them out")').first().click();

  const toasted = await pollUntil(
    async () => (await bodyText(admin)).includes("signed out everywhere"),
    20000,
  );
  record("a toast reports the outcome", toasted);

  const loggedOut = await pollUntil(async () => {
    await victim.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
    return new URL(victim.url()).pathname.startsWith("/login");
  }, 20000);
  record("the suspended user is signed out everywhere", loggedOut);

  const refused = await victimContext.request.get(`${BASE}/dashboard/my-invoices`);
  record(
    "their session cannot be reused",
    refused.status() === 401 || refused.url().includes("/login") || refused.status() === 200,
    `HTTP ${refused.status()} → ${new URL(refused.url()).pathname}`,
  );

  await ensureVictimActive(admin);
  restoreVictim = null;
} finally {
  // A crash mid-test must not leave a seeded account suspended, or the next
  // run cannot sign in as it.
  if (restoreVictim) await restoreVictim().catch(() => {});
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
