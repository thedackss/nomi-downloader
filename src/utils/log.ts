let debugEnabled = false;

/** Ring buffer of recent log lines, included in bug reports for context. */
const RECENT_LIMIT = 100;
const recentLogs: string[] = [];

// Only the popup and the background worker log; each context persists its
// buffer so a report can merge both (and survive service-worker restarts).
const CONTEXT = typeof document === "undefined" ? "background" : "popup";
const STORAGE_PREFIX = "recentLogs.";

let persistTimer: ReturnType<typeof setTimeout> | undefined;

function sessionStore() {
    return typeof chrome !== "undefined" ? chrome.storage?.session : undefined;
}

/** Debounced write of the buffer to session storage (cleared on browser close). */
function persistLogs() {
    const store = sessionStore();
    if (!store) return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
        store
            .set({ [STORAGE_PREFIX + CONTEXT]: [...recentLogs] })
            .catch(() => {});
    }, 250);
}

/** Enable verbose logging at runtime (e.g. the "Debug mode" setting). */
export function setDebugLogging(enabled: boolean) {
    debugEnabled = enabled;
}

export function Log(...data: unknown[]) {
    const { MODE } = import.meta.env;

    // Always keep a trimmed copy for bug reports, even when not printing.
    recentLogs.push(
        `${new Date().toISOString()} [${CONTEXT}] ${stringifyArgs(data)}`,
    );
    if (recentLogs.length > RECENT_LIMIT) recentLogs.shift();
    persistLogs();

    if (MODE === "development" || debugEnabled) {
        console.log("[NomiDownloader]", ...data);
    }
}

/** The recent log lines as a single string, oldest first. */
export function getRecentLogs(): string {
    return recentLogs.join("\n");
}

/**
 * This context's live buffer merged with the other context's persisted logs,
 * sorted chronologically (lines start with an ISO timestamp). Falls back to
 * the in-memory buffer where session storage is unavailable (e.g. tests).
 */
export async function getMergedLogs(): Promise<string> {
    const store = sessionStore();
    if (!store) return getRecentLogs();

    const other = CONTEXT === "popup" ? "background" : "popup";
    try {
        const key = STORAGE_PREFIX + other;
        const stored = (await store.get(key))[key] as string[] | undefined;
        return [...(stored ?? []), ...recentLogs].sort().join("\n");
    } catch {
        return getRecentLogs();
    }
}

function stringifyArgs(data: unknown[]): string {
    return data
        .map((item) => {
            if (typeof item === "string") return item;
            if (item instanceof Error) return `${item.name}: ${item.message}`;
            try {
                return JSON.stringify(item);
            } catch {
                return String(item);
            }
        })
        .join(" ");
}
