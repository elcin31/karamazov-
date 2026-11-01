/** Real browser capture matrix for KARAMAZOV 2.0; inspect the resulting PNGs before reporting visual conclusions. */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const pass = process.argv[2] || "pass1";
const output = `qa-artifacts/visual-v2/${pass}`;
await mkdir(output, { recursive: true });
const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const routes = [
  ["home", "/"],
  ["character", "/characters/ivan"],
  ["reader", "/read/5-5"],
  ["study", "/philosophy/evil"],
  ["gallery", "/gallery"],
  ["map", "/map"],
  ["court", "/court"],
  ["timeline", "/timeline"],
];
const binary = process.env.PLAYWRIGHT_CHROMIUM_PATH || "/usr/bin/chromium";
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(binary) ? { executablePath: binary } : {}),
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
await page.locator(".spoiler-switch").waitFor();
await page.waitForFunction(
  () => !document.querySelector(".spoiler-switch")?.disabled,
);
if (
  (await page.locator(".spoiler-switch").getAttribute("aria-pressed")) ===
  "true"
)
  await page.locator(".spoiler-switch").click();
await page.waitForTimeout(500);
const results = [];
for (const width of widths) {
  const height = width >= 1024 ? 1000 : width >= 768 ? 1024 : 844;
  await page.setViewportSize({ width, height });
  for (const [name, route] of routes) {
    const before = pageErrors.length;
    const response = await page.goto(base + route, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.evaluate(() => document.fonts.ready);
    if (name === "map")
      await page
        .locator(".react-flow__node")
        .first()
        .waitFor({ timeout: 30000 });
    if (name === "reader")
      await page.locator(".reader-prose p").first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(150);
    await page.evaluate(async () => {
      const images = [...document.images].filter((i) => {
        const r = i.getBoundingClientRect();
        return r.top < innerHeight && r.bottom > 0;
      });
      await Promise.all(
        images.map((i) =>
          i.complete
            ? Promise.resolve()
            : new Promise((res) => {
                i.onload = res;
                i.onerror = res;
                setTimeout(res, 5000);
              }),
        ),
      );
    });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(100);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      width: innerWidth,
      bodyWidth: document.body.scrollWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
      overflowNodes: [...document.querySelectorAll("body *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.width > 0 &&
            (r.right > innerWidth + 1 || r.left < -1) &&
            getComputedStyle(e).position !== "fixed" &&
            !e.closest(".react-flow__viewport")
          );
        })
        .slice(0, 12)
        .map((e) => ({
          tag: e.tagName,
          cls: e.className,
          text: e.textContent?.trim().slice(0, 60),
          right: e.getBoundingClientRect().right,
          left: e.getBoundingClientRect().left,
        })),
      h1: document.querySelector("h1")?.textContent,
      background: getComputedStyle(document.body).backgroundColor,
      reading: (() => {
        const e =
          document.querySelector(".reader-prose") ||
          document.querySelector(".article-body.prose");
        if (!e) return null;
        const c = getComputedStyle(e);
        return {
          font: c.fontFamily,
          size: c.fontSize,
          lineHeight: c.lineHeight,
          width: e.getBoundingClientRect().width,
        };
      })(),
    }));
    const path = `${output}/${width}-${name}.png`;
    await page.screenshot({ path, animations: "disabled" });
    if ((width === 390 || width === 1440) && name === "home")
      await page.screenshot({
        path: `${output}/${width}-${name}-full.png`,
        fullPage: true,
        animations: "disabled",
      });
    if (["character", "study", "reader"].includes(name)) {
      const target =
        name === "reader"
          ? page.locator(".reader-prose p").nth(3)
          : page.locator(".article-body .article-section").nth(1);
      if (await target.count()) {
        await target.scrollIntoViewIfNeeded();
        await page.waitForTimeout(80);
        await page.screenshot({
          path: `${output}/${width}-${name}-reading.png`,
          animations: "disabled",
        });
      }
    }
    const detailSelector = {
      gallery: ".collection-work",
      map: ".relationship-map",
      court: ".court-evidence",
      timeline: ".timeline-body",
    }[name];
    if (detailSelector) {
      const detail = page.locator(detailSelector).first();
      if (await detail.count()) {
        await detail.evaluate((e) =>
          e.scrollIntoView({ block: "start", behavior: "instant" }),
        );
        await page.waitForTimeout(100);
        await detail.locator("img").evaluateAll(async (imgs) => {
          await Promise.all(
            imgs.map((i) =>
              i.complete
                ? Promise.resolve()
                : new Promise((res) => {
                    i.onload = res;
                    i.onerror = res;
                    setTimeout(res, 5000);
                  }),
            ),
          );
        });
        await page.screenshot({
          path: `${output}/${width}-${name}-detail.png`,
          animations: "disabled",
        });
      }
    }
    const entry = {
      width,
      height,
      name,
      route,
      status: response?.status(),
      path,
      ...metrics,
      pageErrors: pageErrors.slice(before),
    };
    results.push(entry);
    if (metrics.overflow) console.log("OVERFLOW", JSON.stringify(entry));
  }
  console.log(`Captured ${width}px:8 routes`);
  await writeFile(`${output}/metrics.json`, JSON.stringify(results, null, 2));
}
await writeFile(`${output}/metrics.json`, JSON.stringify(results, null, 2));
console.log(
  JSON.stringify({
    pass,
    total: results.length,
    overflow: results
      .filter((r) => r.overflow)
      .map((r) => ({ width: r.width, route: r.route, nodes: r.overflowNodes })),
    pageErrors,
  }),
);
await browser.close();
