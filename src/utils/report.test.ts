import { describe, expect, it, vi } from "vitest";

// buildReportText reads chrome.runtime + navigator, so stub them before import.
vi.stubGlobal("chrome", {
    runtime: { getManifest: () => ({ version: "0.4.4" }) },
});

const UAS: Array<[string, string]> = [
    [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:153.0) Gecko/20100101 Firefox/153.0",
        "Firefox Windows",
    ],
    [
        "Mozilla/5.0 (X11; Linux x86_64; rv:154.0) Gecko/20100101 Firefox/154.0",
        "Firefox Linux",
    ],
    [
        "Mozilla/5.0 (Android 16; Mobile; rv:154.0) Gecko/154.0 Firefox/154.0",
        "Firefox Android",
    ],
    [
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Chrome Linux",
    ],
    [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 Edg/120",
        "Edge macOS",
    ],
    [
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605 (KHTML, like Gecko) FxiOS/121.0 Mobile",
        "Firefox iOS",
    ],
];

describe("report Platform line", () => {
    it.each(UAS)("labels %s", async (ua, expected) => {
        vi.stubGlobal("navigator", { userAgent: ua });
        // Fresh import each case so the stubbed navigator is read.
        vi.resetModules();
        const { buildReportText } = await import("./report");
        expect(buildReportText(new Error("boom"), "background")).toContain(
            `Platform: ${expected}`,
        );
    });
});
