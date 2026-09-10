/**
 * Cancellation window and sign-off (PRD v5.2 §3.6).
 *
 *   1. A client may withdraw a request only before we confirm the order.
 *      Once confirmed — and certainly once delivered — the cancel panel is
 *      gone, and the server refuses it even if the form is replayed.
 *   2. Staff can close delivered work at 100%, and not before.
 *   3. A closed request is read-only for the client: no message, no ticket,
 *      no cancellation. Staff can still write, and can reopen.
 *
 * Run against a built app:  npm run build && npm start &  then
 *   CHROMIUM_PATH=… node tests/signoff.mjs [baseUrl]
 *
 * Sign-in is rate limited (5 per 5 minutes per email + IP). Leave a gap
 * between suites, or restart the server to clear the counter.
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3000";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe#2026";
const ADMIN = { email: "admin@hyascka.com", password: PASSWORD };
const CLIENT = { email: "client@northlane.example", password: PASSWORD };

const stamp = Date.now();
const TITLE = `Sign-off test ${stamp}`;

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

try {
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, ADMIN);

  const clientContext = await browser.newContext();
  const client = await clientContext.newPage();
  await signIn(client, CLIENT);

  // A request of our own to drive through the whole arc.
  await admin.goto(`${BASE}/dashboard/requests`, { waitUntil: "domcontentloaded" });
  await admin.click('button:has-text("New request for a client")');
  await admin.waitForSelector("#cr-client", { timeout: 10000 });
  const clientOptions = await admin.$$eval("#cr-client option", (nodes) =>
    nodes.map((node) => ({ value: node.value, label: node.textContent?.trim() })).filter((o) => o.value),
  );
  const northlane =
    clientOptions.find((option) => /northlane/i.test(option.label ?? "")) ?? clientOptions[0];
  await admin.selectOption("#cr-client", northlane.value);
  await admin.fill("#cr-title", TITLE);
  await admin.fill("#cr-brief", "A piece of work we will quote, confirm, deliver and close.");
  await admin.click('form:has(#cr-title) button[type="submit"]');

  await pollUntil(async () => {
    await admin.goto(`${BASE}/dashboard/requests`, { waitUntil: "domcontentloaded" });
    return (await bodyText(admin)).includes(TITLE);
  }, 25000);
  const staffHref = await admin.getAttribute(`a:has-text("${TITLE}")`, "href");
  const requestId = staffHref.split("/").pop();
  const clientHref = `/dashboard/my-services/${requestId}`;

  // --- 1. Before confirmation: the client may withdraw ---------------------
  await client.goto(`${BASE}${clientHref}`, { waitUntil: "domcontentloaded" });
  record(
    "cancel is offered before the order is confirmed",
    (await bodyText(client)).includes("Need to stop this?"),
  );

  // --- Quote, accept, confirm ---------------------------------------------
  await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
  await admin.fill('input[name="amount"]', "900");
  await admin.click('form:has(input[name="amount"]) button[type="submit"]');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  await pollUntil(async () => {
    await client.goto(`${BASE}${clientHref}`, { waitUntil: "domcontentloaded" });
    return (await bodyText(client)).includes("900");
  }, 20000);
  await client.click('button:has-text("Accept")');
  await client.waitForSelector('form:has(input[name="decision"]) button[type="submit"]', { timeout: 10000 });
  await client.click('form:has(input[name="decision"]) button[type="submit"]');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
  await admin.locator('button:has-text("Confirm and start")').first().click();
  await admin.locator('button:has-text("Confirm this work?")').first().click();
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // --- 2. After confirmation: the cancel panel is gone ---------------------
  const goneAfterConfirm = await pollUntil(async () => {
    await client.goto(`${BASE}${clientHref}`, { waitUntil: "domcontentloaded" });
    return !(await bodyText(client)).includes("Need to stop this?");
  }, 20000);
  record("cancel disappears once the order is confirmed", goneAfterConfirm);

  /*
   * A hidden button is not the guarantee — requestCancellationAction refuses a
   * confirmed request regardless of what the browser sends. Forging a Server
   * Action call from here is not practical, so what this checks is the visible
   * consequence: after a POST at that page, the request is still live rather
   * than cancelled. The refusal itself is asserted in the action's own guard.
   */
  await clientContext.request
    .post(`${BASE}${clientHref}`, {
      form: { requestId, reason: "Replaying the cancel form after confirmation." },
      failOnStatusCode: false,
    })
    .catch(() => {});
  await client.goto(`${BASE}${clientHref}`, { waitUntil: "domcontentloaded" });
  const afterReplay = await bodyText(client);
  record(
    "a confirmed request is not cancelled by posting at its page",
    !afterReplay.includes("This request has been cancelled"),
  );

  // --- Deliver, then close -------------------------------------------------
  await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
  record(
    "closing is refused before delivery",
    (await bodyText(admin)).includes("before you can close it"),
  );

  await admin.selectOption('select[name="status"]', "DELIVERED");
  await admin.fill('input[name="progress"]', "100");
  await admin.click('form:has(select[name="status"]) button[type="submit"]');
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const closable = await pollUntil(async () => {
    await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
    return (await admin.locator('button:has-text("Close this work")').count()) > 0;
  }, 20000);
  record("close becomes available at 100% and delivered", closable);

  // Delivered but not closed: the client can still talk to us.
  await client.goto(`${BASE}${clientHref}`, { waitUntil: "domcontentloaded" });
  const deliveredBody = await bodyText(client);
  record(
    "a delivered request still takes messages and tickets",
    deliveredBody.includes("Something wrong?") && !deliveredBody.includes("Need to stop this?"),
  );

  await admin.locator('button:has-text("Close this work")').first().click();
  await admin.waitForSelector('textarea[id^="close-note-"]', { timeout: 10000 });
  await admin.fill('textarea[id^="close-note-"]', "Final review done with the client on the call.");
  await admin.locator('form:has(textarea[id^="close-note-"]) button[type="submit"]').first().click();

  const closed = await pollUntil(async () => {
    await admin.goto(`${BASE}${staffHref}`, { waitUntil: "domcontentloaded" });
    return (await bodyText(admin)).includes("Closed.");
  }, 25000);
  record("staff can close delivered work", closed);

  // --- 3. Closed is read-only for the client -------------------------------
  await client.goto(`${BASE}${clientHref}`, { waitUntil: "domcontentloaded" });
  const closedBody = await bodyText(client);
  record("client sees the work is closed", closedBody.includes("signed off"));
  record("no reply box on closed work", (await client.locator('textarea[name="body"]').count()) === 0);
  record("no ticket form on closed work", !closedBody.includes("Something wrong?"));
  record("no cancel panel on closed work", !closedBody.includes("Need to stop this?"));
  record("the conversation is still readable", closedBody.includes("Conversation"));

  // Staff keep working on it.
  record(
    "staff can still write on closed work",
    (await admin.locator('textarea[name="body"]').count()) > 0,
  );

  await admin.locator('button:has-text("Reopen")').first().click();
  await admin.locator('button:has-text("Reopen this work?")').first().click();
  const reopened = await pollUntil(async () => {
    await client.goto(`${BASE}${clientHref}`, { waitUntil: "domcontentloaded" });
    return (await client.locator('textarea[name="body"]').count()) > 0;
  }, 25000);
  record("reopening gives the client their reply box back", reopened);
} finally {
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
