import { Log } from "../../utils/log";
import { SITE_URL } from "../../utils/site";

/** Opt-in stats sync endpoint (POST a day's counters, DELETE to wipe). */
export const STATS_ENDPOINT = `${SITE_URL}/api/stats`;

const HISTORY_KEY = "dailyStats";
const HISTORY_DAYS = 90;

export interface DayCounts {
    sent: number;
    received: number;
    selfies: number;
}

/**
 * Local usage history: one row per day in chrome.storage.local, capped to the
 * last 90 days. Written on every stats load; never leaves the device unless
 * stats sync is turned on.
 */
export async function recordToday(counts: DayCounts): Promise<void> {
    try {
        const day = new Date().toISOString().slice(0, 10);
        const stored = await chrome.storage.local.get(HISTORY_KEY);
        const history = (
            stored[HISTORY_KEY] && typeof stored[HISTORY_KEY] === "object"
                ? stored[HISTORY_KEY]
                : {}
        ) as Record<string, DayCounts>;
        history[day] = counts;
        const days = Object.keys(history).sort();
        for (const old of days.slice(
            0,
            Math.max(0, days.length - HISTORY_DAYS),
        )) {
            delete history[old];
        }
        await chrome.storage.local.set({ [HISTORY_KEY]: history });
    } catch (err) {
        Log("Failed to record daily stats", err);
    }
}

/** The locally stored history, oldest day first. */
export async function getHistory(): Promise<Array<[string, DayCounts]>> {
    try {
        const stored = await chrome.storage.local.get(HISTORY_KEY);
        const history = (stored[HISTORY_KEY] ?? {}) as Record<
            string,
            DayCounts
        >;
        return Object.entries(history).sort(([a], [b]) => a.localeCompare(b));
    } catch {
        return [];
    }
}

/**
 * Push today's counters to the server, keyed by the account's publicId.
 * Called only while the user has stats sync enabled.
 */
export async function syncToday(
    publicId: string,
    counts: DayCounts,
): Promise<void> {
    try {
        await fetch(STATS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                publicId,
                sent: counts.sent,
                received: counts.received,
                images: counts.selfies,
                version: chrome.runtime.getManifest().version,
            }),
        });
    } catch (err) {
        Log("Stats sync failed", err);
    }
}

/** "Delete my synced data": wipes everything stored for this publicId. */
export async function deleteSynced(publicId: string): Promise<boolean> {
    try {
        const res = await fetch(
            `${STATS_ENDPOINT}/${encodeURIComponent(publicId)}`,
            { method: "DELETE" },
        );
        return res.ok;
    } catch (err) {
        Log("Stats delete failed", err);
        return false;
    }
}
