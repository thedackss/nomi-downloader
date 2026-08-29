import { Log } from "./log";

/** GET endpoint returning the latest published version as `{ version }`. */
export const VERSION_ENDPOINT = "https://nomi.zar.mx/api/version";

/** The store listing (release notes) for this build target. */
export const STORE_URL = __IS_FIREFOX__
    ? "https://nomi.zar.mx/firefox"
    : "https://nomi.zar.mx/chrome";

/**
 * How to force an update now. Neither store has an "update" button — browsers
 * auto-update extensions in the background (usually within a day); this is the
 * manual path for the impatient, and differs per browser.
 */
export const MANUAL_UPDATE_HINT = __IS_FIREFOX__
    ? "The add-on updates automatically. To update now: open about:addons, click the gear icon, and choose “Check for Updates”."
    : "The extension updates automatically. To update now: open chrome://extensions, turn on Developer mode, and click “Update”.";

export interface VersionCheck {
    /** The installed version (from the manifest). */
    current: string;
    /** The latest version the server reports. */
    latest: string;
    /** True when `current` is older than `latest`. */
    outdated: boolean;
}

/**
 * Compare two dot-separated version strings numerically.
 * Returns <0 if a is older, 0 if equal, >0 if a is newer. Missing or
 * non-numeric parts count as 0, so "0.4" == "0.4.0".
 */
export function compareVersions(a: string, b: string): number {
    const pa = a.split(".");
    const pb = b.split(".");
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const na = parseInt(pa[i] ?? "0", 10) || 0;
        const nb = parseInt(pb[i] ?? "0", 10) || 0;
        if (na !== nb) return na - nb;
    }
    return 0;
}

/**
 * Ask the server for the latest version and compare it to this build.
 * Returns null on any network/parse failure — the caller treats "unknown" as
 * "don't nag the user".
 */
export type UpdateResult =
    /** An update was found and downloaded; the extension is reloading. */
    | "updating"
    /** Already on the newest version the store has (may lag our endpoint). */
    | "no_update"
    /** Chrome rate-limited the check; try again shortly. */
    | "throttled"
    /** No programmatic update API (Firefox, or an unpacked dev build). */
    | "unsupported"
    | "error";

/**
 * Ask Chrome to check the Web Store for an update right now. When one is found
 * Chrome downloads it and we reload to apply it immediately (the popup closes).
 * Firefox has no equivalent API, and unpacked builds have no update URL — both
 * resolve "unsupported", so callers should fall back to the manual hint.
 */
export function requestChromeUpdate(): Promise<UpdateResult> {
    const runtime = chrome.runtime as typeof chrome.runtime & {
        requestUpdateCheck?: (
            cb: (status: string, details?: { version: string }) => void,
        ) => void;
    };
    if (__IS_FIREFOX__ || typeof runtime.requestUpdateCheck !== "function") {
        return Promise.resolve("unsupported");
    }
    return new Promise((resolve) => {
        try {
            runtime.requestUpdateCheck?.((status) => {
                if (chrome.runtime.lastError) {
                    Log("requestUpdateCheck error", chrome.runtime.lastError);
                    resolve("error");
                    return;
                }
                if (status === "update_available") {
                    resolve("updating");
                    chrome.runtime.reload();
                } else {
                    resolve(status === "throttled" ? "throttled" : "no_update");
                }
            });
        } catch (err) {
            Log("requestUpdateCheck threw", err);
            resolve("error");
        }
    });
}

let cachedCheck: Promise<VersionCheck | null> | null = null;

/**
 * Shared, memoized {@link checkForUpdate} — the popup mounts several consumers
 * (the main-view banner, the Help footer) but only one request should go out
 * per popup session. The result is cached for the life of the popup.
 */
export function getUpdateCheck(): Promise<VersionCheck | null> {
    cachedCheck ??= checkForUpdate();
    return cachedCheck;
}

export async function checkForUpdate(): Promise<VersionCheck | null> {
    const current = chrome.runtime.getManifest().version;
    try {
        const res = await fetch(VERSION_ENDPOINT, {
            headers: { Accept: "application/json" },
        });
        if (!res.ok) {
            Log("Version check failed", res.status);
            return null;
        }
        const data: unknown = await res.json();
        const latest =
            typeof data === "object" &&
            data !== null &&
            typeof (data as { version?: unknown }).version === "string"
                ? (data as { version: string }).version
                : "";
        if (!latest) {
            Log("Version check: malformed response", data);
            return null;
        }
        return {
            current,
            latest,
            outdated: compareVersions(current, latest) < 0,
        };
    } catch (err) {
        Log("Version check threw", err);
        return null;
    }
}
