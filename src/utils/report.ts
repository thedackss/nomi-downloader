import { getMergedLogs, getRecentLogs } from "./log";

/**
 * Where bug reports are POSTed. Cross-origin from the extension, so the API
 * allows the chrome-/moz-extension origins via CORS (it's not in
 * host_permissions).
 */
export const BUGS_ENDPOINT = "https://nomi.zar.mx/api/bugs";

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
        .replace(
            /(cookie|authorization|set-cookie)\s*[:=]\s*[^\n]+/gi,
            "$1: [redacted]",
        )
        .replace(/[A-Za-z0-9_-]{40,}/g, "[redacted]");
}

/**
 * Build the plain-text bug report for a thrown error. Runs in both the popup
 * and the background worker (both expose chrome.runtime + navigator).
 */
export function buildReportText(error: unknown, source = "unknown"): string {
    const version = chrome.runtime.getManifest().version;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "n/a";

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

// Cap the merged logs so a report stays well under the API's size limit;
// keep the tail — the newest lines are the ones that matter.
const LOGS_MAX_CHARS = 15000;

async function mergedLogsCapped(): Promise<string> {
    const logs = (await getMergedLogs()) || "(none)";
    return logs.length > LOGS_MAX_CHARS
        ? `…(older lines trimmed)\n${logs.slice(-LOGS_MAX_CHARS)}`
        : logs;
}

function reportHeader(kind: string): string[] {
    const version = chrome.runtime.getManifest().version;
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "n/a";
    return [
        `Nomi Downloader ${kind}`,
        `When: ${new Date().toISOString()}`,
        `Version: ${version}`,
        `User agent: ${ua}`,
    ];
}

/**
 * Build a user-initiated report: their name, reply-to email and description
 * first (so they survive any truncation), then the merged popup + worker logs.
 */
export async function buildUserReportText(
    description: string,
    email: string,
    name: string,
): Promise<string> {
    const report = [
        ...reportHeader("user report"),
        `From: ${name.trim() || "(not provided)"}`,
        `Reply-to: ${email.trim() || "(not provided)"}`,
        ``,
        `Description:`,
        description.trim() || "(none)",
        ``,
        `Recent logs:`,
        await mergedLogsCapped(),
    ].join("\n");

    return scrub(report);
}

/** Build the "copy logs" text: the same header + merged logs, no user input. */
export async function buildLogsText(): Promise<string> {
    const report = [
        ...reportHeader("logs"),
        ``,
        `Recent logs:`,
        await mergedLogsCapped(),
    ].join("\n");

    return scrub(report);
}
