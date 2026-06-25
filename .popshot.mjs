import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 820, height: 620 } });
await p.addInitScript(() => {
  const noop = () => {};
  window.chrome = {
    runtime: { sendMessage: () => Promise.resolve({}), onMessage: { addListener: noop, removeListener: noop }, id: "x" },
    tabs: { query: () => Promise.resolve([{ url: "https://beta.nomi.ai/" }]) },
    storage: { local: { get: () => Promise.resolve({}), set: () => Promise.resolve() } },
  };
});
await p.goto("http://localhost:4173/", { waitUntil: "load" });
await p.waitForTimeout(1500);
await p.screenshot({ path: process.argv[2] });
await b.close(); console.log("ok");
