import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 800 } });
await p.goto("http://localhost:5187/preview/chat.html", { waitUntil: "load" });
await p.waitForTimeout(1200);
// scroll the iframe's body down to verify bg stays put + scrollbar usable
const f = p.frames().find(fr => fr.url().includes("chat.html")) || p.mainFrame();
await p.screenshot({ path: process.argv[2] });
await b.close(); console.log("ok");
