import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4174",
    env: {
      VITE_API_BASE_URL: "http://127.0.0.1:9999",
      VITE_MOCK_API: "true",
    },
    reuseExistingServer: false,
    url: "http://127.0.0.1:4174",
  },
});
