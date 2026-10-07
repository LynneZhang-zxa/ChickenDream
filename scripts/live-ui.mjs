// Drives the real cooking screen in headless Chromium with a fake microphone: starts a live ALEBEX
// call from the browser, waits for the greeting, screenshots the in-call UI, uses the manual controls.
import { chromium } from "playwright";
const out = process.argv[2];
const browser = await chromium.launch({
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ["microphone"] });
const page = await ctx.newPage();
const logs = [];
page.on("console", (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on("pageerror", (e) => logs.push(`pageerror: ${e}`));
const t0 = Date.now();
const stamp = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

await page.goto("http://localhost:3000/cook", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Start cooking" }).click();
console.log(stamp(), "clicked start");
await page.getByText(/Listening|Sous is speaking/).first().waitFor({ timeout: 30000 });
console.log(stamp(), "call is live:", await page.locator("aside p.font-display").first().textContent());
await page.waitForTimeout(2500);
await page.screenshot({ path: `${out}/cook-live-speaking.png`, fullPage: false });
console.log(stamp(), "status now:", await page.locator("aside p.font-display").first().textContent());
await page.getByText("Listening", { exact: true }).waitFor({ timeout: 30000 }).catch(() => console.log("did not return to Listening"));
console.log(stamp(), "status:", await page.locator("aside p.font-display").first().textContent());
await page.screenshot({ path: `${out}/cook-live-listening.png`, fullPage: false });
await page.getByRole("button", { name: "Next step" }).click();
await page.waitForTimeout(2000);
console.log(stamp(), "after manual next:", await page.locator("text=/Step \\d of \\d/").first().textContent());
await page.getByRole("button", { name: "Next step" }).click();
await page.waitForTimeout(2000);
console.log(stamp(), "after manual next:", await page.locator("text=/Step \\d of \\d/").first().textContent());
await page.screenshot({ path: `${out}/cook-live-step3.png`, fullPage: true });
await page.getByRole("button", { name: "End cooking" }).click();
await page.waitForTimeout(1500);
console.log(stamp(), "ended. status:", await page.locator("aside p.font-display").first().textContent().catch(() => "(gone)"));
const errors = logs.filter((l) => /^(error|pageerror)/.test(l) && !/favicon/.test(l));
console.log("console errors:", errors.length ? errors : "none");
console.log("alebex frames seen:", logs.filter((l) => /\[alebex\]/.test(l)).slice(0, 8));
await browser.close();
