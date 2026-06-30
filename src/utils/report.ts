import { getRecentLogs } from "./log";

/**
 * Where bug reports are POSTed. Placeholder domain — replace with the real
 * endpoint, and update the matching entry in manifest.json `host_permissions`.
 */
export const BUGS_ENDPOINT = "https://someapi.tld/nomi-ext/bugs";

/** Turn an unknown thrown value into "Name: message\n<stack>". */
function describeError(error: unknown): string {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}\n${error.stack ?? ""}`.trim();
    }
    if (typeof error === "string") return error;
    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

/** Light defense-in-depth scrub of session cookies / auth tokens. */
function scrub(text: string): string {
    return text
        .replace(/(cookie|authorization|set-cookie)\s*[:=]\s*[^\n]+/gi, "$1: [redacted]")
        .replace(/[A-Za-z0-9_-]{40,}/g, "[redacted]");
}

/**
 * Build the plain-text bug report for a thrown error. Runs in both the popup
 * and the background worker (both expose chrome.runtime + navigator).
 */
export function buildReportText(error: unknown, source = "unknown"): string {
    const version = chrome.runtime.getManifest().version;
    const ua =
        typeof navigator !== "undefined" ? navigator.userAgent : "n/a";

    const report = [
        `Nomi Downloader bug report`,
        `When: ${new Date().toISOString()}`,
        `Version: ${version}`,
        `Source: ${source}`,
        `User agent: ${ua}`,
        ``,
        `Error:`,
        describeError(error),
        ``,
        `Recent logs:`,
        getRecentLogs() || "(none)",
    ].join("\n");

    return scrub(report);
}
