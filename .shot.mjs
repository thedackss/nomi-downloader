import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 1150 } });
await p.goto("http://localhost:5185/preview/chat.html", { waitUntil: "load" });
await p.waitForTimeout(1500);
await p.screenshot({ path: process.argv[2], fullPage: true });
await b.close();
console.log("screenshot ok");
