let debugEnabled = false;

/** Ring buffer of recent log lines, included in bug reports for context. */
const RECENT_LIMIT = 50;
const recentLogs: string[] = [];

/** Enable verbose logging at runtime (e.g. the "Debug mode" setting). */
export function setDebugLogging(enabled: boolean) {
    debugEnabled = enabled;
}

export function Log(...data: unknown[]) {
    const { MODE } = import.meta.env;

    // Always keep a trimmed copy for bug reports, even when not printing.
    recentLogs.push(`${new Date().toISOString()} ${stringifyArgs(data)}`);
    if (recentLogs.length > RECENT_LIMIT) recentLogs.shift();

    if (MODE === "development" || debugEnabled) {
        console.log("[NomiDownloader]", ...data);
    }
}

/** The recent log lines as a single string, oldest first. */
export function getRecentLogs(): string {
    return recentLogs.join("\n");
}

function stringifyArgs(data: unknown[]): string {
    return data
        .map((item) => {
            if (typeof item === "string") return item;
            if (item instanceof Error)
                return `${item.name}: ${item.message}`;
            try {
                return JSON.stringify(item);
            } catch {
                return String(item);
            }
        })
        .join(" ");
}
