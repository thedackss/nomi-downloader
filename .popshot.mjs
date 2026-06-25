import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
await p.addInitScript(() => {
  const noop = () => {};
  window.chrome = {
    runtime: { sendMessage: () => Promise.resolve({}), onMessage: { addListener: noop, removeListener: noop }, id: "x" },
    tabs: { query: () => Promise.resolve([{ url: "https://beta.nomi.ai/" }]) },
    storage: { local: { get: () => Promise.resolve({}), set: () => Promise.resolve() } },
  };
});
await p.goto("http://localhost:4174/", { waitUntil: "load" });
await p.waitForTimeout(1000);
await p.click('button[aria-label="Toggle settings"]');
await p.waitForTimeout(800);
await p.screenshot({ path: process.argv[2] });
await b.close(); console.log("ok");
