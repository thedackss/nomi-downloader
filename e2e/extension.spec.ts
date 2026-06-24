import {
    test as base,
    chromium,
    expect,
    type BrowserContext,
} from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const EXT_PATH = path.resolve(dir, "../dist");

// Load the built extension into a persistent context and expose its id.
const test = base.extend<{ context: BrowserContext; extensionId: string }>({
    // eslint-disable-next-line no-empty-pattern
    context: async ({}, use) => {
        const context = await chromium.launchPersistentContext("", {
            headless: false,
            args: [
                `--disable-extensions-except=${EXT_PATH}`,
                `--load-extension=${EXT_PATH}`,
                "--no-sandbox",
            ],
        });
        await use(context);
        await context.close();
    },
    extensionId: async ({ context }, use) => {
        let [sw] = context.serviceWorkers();
        if (!sw) sw = await context.waitForEvent("serviceworker");
        await use(new URL(sw.url()).host);
    },
});

test("popup mounts and renders without uncaught errors", async ({
    context,
    extensionId,
}) => {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto(`chrome-extension://${extensionId}/index.html`);

    await expect(page.getByText("Nomi Downloader")).toBeVisible();

    const rootChildren = await page.evaluate(
        () => document.getElementById("root")?.children.length ?? 0,
    );
    expect(rootChildren).toBeGreaterThan(0);
    expect(errors).toEqual([]);
});

test("settings panel opens from the gear icon", async ({
    context,
    extensionId,
}) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/index.html`);

    await page.locator("svg").first().click();

    await expect(page.getByText("Interface")).toBeVisible();
});
