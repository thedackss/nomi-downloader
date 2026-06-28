// Incremental download bookkeeping (BETA). Remembers, per Nomi/group, the
// completion time of the newest item already downloaded, so a later run can
// fetch only newer content. State lives in chrome.storage.local because the
// MV3 service worker has no localStorage. Keyed by kind so album / chat / group
// histories are independent.

import { Log } from "../../utils/log";

const STORAGE_KEY = "nomi_incremental";

export type IncrementalKind = "album" | "chat" | "group";

/** kind → (id → newest downloaded ISO timestamp). */
type IncrementalState = Record<IncrementalKind, Record<string, string>>;

function emptyState(): IncrementalState {
    return { album: {}, chat: {}, group: {} };
}

function hasStorage(): boolean {
    return typeof chrome !== "undefined" && !!chrome.storage?.local;
}

async function read(): Promise<IncrementalState> {
    if (!hasStorage()) return emptyState();
    try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const stored = result?.[STORAGE_KEY] as
            | Partial<IncrementalState>
            | undefined;
        return { ...emptyState(), ...stored };
    } catch (err) {
        Log("Failed to read incremental state", err);
        return emptyState();
    }
}

/** The newest already-downloaded timestamp for this item, or undefined. */
export async function getLastTimestamp(
    kind: IncrementalKind,
    id: number | string,
): Promise<string | undefined> {
    const state = await read();
    return state[kind]?.[String(id)];
}

/** Record the newest downloaded timestamp after a successful download. */
export async function setLastTimestamp(
    kind: IncrementalKind,
    id: number | string,
    timestamp: string,
): Promise<void> {
    if (!hasStorage() || !timestamp) return;
    try {
        const state = await read();
        state[kind] = { ...state[kind], [String(id)]: timestamp };
        await chrome.storage.local.set({ [STORAGE_KEY]: state });
        Log(`Incremental: ${kind} #${id} caught up to ${timestamp}`);
    } catch (err) {
        Log("Failed to write incremental state", err);
    }
}

/** Forget everything — the next download of each item fetches in full again. */
export async function clearIncremental(): Promise<void> {
    if (!hasStorage()) return;
    try {
        await chrome.storage.local.remove(STORAGE_KEY);
        Log("Incremental history cleared");
    } catch (err) {
        Log("Failed to clear incremental state", err);
    }
}

/**
 * Keep only items strictly newer than `lastTimestamp` (by parsed date). With no
 * baseline, everything is returned. `getTimestamp` reads each item's date.
 */
export function filterNewerThan<T>(
    items: T[],
    getTimestamp: (item: T) => string,
    lastTimestamp?: string,
): T[] {
    if (!lastTimestamp) return items;
    const cutoff = new Date(lastTimestamp).getTime();
    if (Number.isNaN(cutoff)) return items;
    return items.filter((item) => {
        const ts = new Date(getTimestamp(item)).getTime();
        return !Number.isNaN(ts) && ts > cutoff;
    });
}

/** The newest timestamp across items (latest wins), or undefined if empty. */
export function newestTimestamp<T>(
    items: T[],
    getTimestamp: (item: T) => string,
): string | undefined {
    let newest: string | undefined;
    let newestMs = Number.NEGATIVE_INFINITY;
    for (const item of items) {
        const raw = getTimestamp(item);
        const ms = new Date(raw).getTime();
        if (!Number.isNaN(ms) && ms > newestMs) {
            newestMs = ms;
            newest = raw;
        }
    }
    return newest;
}
