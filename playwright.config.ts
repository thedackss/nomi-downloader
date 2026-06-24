import { defineConfig } from "@playwright/test";

// The popup is tested against the real built extension in dist/. Browser
// extensions can only be loaded by a full (headful) Chromium, so these tests
// run with headless: false — on a headless server, run them under Xvfb
// (see the test:e2e script).
export default defineConfig({
    testDir: "./e2e",
    timeout: 30_000,
    fullyParallel: false,
    reporter: [["list"]],
    use: {
        headless: false,
    },
});
