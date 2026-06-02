import { defineConfig, devices } from "@playwright/test";

const MOBILE_WEB_URL = "http://127.0.0.1:19006";

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  projects: [
    {
      name: "chromium-mobile-web",
      use: {
        ...devices["Desktop Chrome"],
        deviceScaleFactor: 1,
        viewport: {
          height: 844,
          width: 390
        }
      }
    }
  ],
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }]
  ],
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/visual",
  timeout: 60_000,
  use: {
    baseURL: MOBILE_WEB_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "pnpm serve:visual:web",
    reuseExistingServer: !process.env.CI,
    stderr: "pipe",
    stdout: "pipe",
    timeout: 120_000,
    url: `${MOBILE_WEB_URL}/visual/card-preview`
  }
});
