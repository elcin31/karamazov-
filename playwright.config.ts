import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const chromiumPath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH || "/usr/bin/chromium";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    headless: true,
    browserName: "chromium",
    launchOptions: {
      ...(existsSync(chromiumPath) ? { executablePath: chromiumPath } : {}),
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
});
