import { chromium } from "playwright";
const out = process.argv[2];
const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["microphone"] });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e}`));
await page.goto("http://localhost:3000/cook", { waitUntil: "networkidle" });
const startResp = page.waitForResponse((r) => r.url().includes("/api/call/start"));
await page.getByRole("button", { name: "Start cooking" }).click();
const cfg = await (await startResp).json();
await page.getByText("Listening", { exact: true }).waitFor({ timeout: 40000 });
console.log("live. session", cfg.sessionId.slice(0, 8));

// Timer: start an 8 second timer through the tools API (as the agent would), watch the UI fire it.
const headers = { "Content-Type": "application/json", "X-Sous-Session": cfg.sessionId, "X-Sous-Secret": cfg.secret };
const t = await (await fetch("http://localhost:3000/api/tools", { method: "POST", headers, body: JSON.stringify({ tool: "manage_timer", arguments: { action: "start", label: "garlic", seconds: 8 } }) })).json();
console.log("timer tool said:", t.spoken);
await page.getByText("Timers").waitFor({ timeout: 5000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/cook-timer.png`, fullPage: false });
const speaking = page.getByText("Sous is speaking").waitFor({ timeout: 25000 }).then(() => true).catch(() => false);
await page.waitForTimeout(8500);
const state = await (await fetch(`http://localhost:3000/api/session/${cfg.sessionId}`)).json();
console.log("timer status after it ended:", state.timers.map((x) => `${x.label}:${x.status}`).join(","));
console.log("agent spoke after timer:", await speaking);

// Finish: step through all nine steps with the manual control.
for (let i = 0; i < 9; i++) {
  await page.getByRole("button", { name: "Next step" }).click();
  await page.waitForTimeout(900);
}
await page.getByText(/is ready\./).waitFor({ timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/cook-finished.png`, fullPage: false });
console.log("finished state visible:", await page.getByText(/is ready\./).textContent());
await page.getByRole("button", { name: "End cooking" }).click();
await page.waitForTimeout(800);
const errors = logs.filter((l) => /^(error|pageerror)/.test(l) && !/favicon/.test(l));
console.log("console errors:", errors.length ? errors : "none");
await browser.close();
