import { getInstallId } from "../../utils/installId";
import { Log } from "../../utils/log";
import { BUGS_ENDPOINT } from "../../utils/report";

const IDS_KEY = "reportIds";
const TICKETS_KEY = "tickets";
/** Only this many report ids are remembered (and polled for replies). */
const MAX_TRACKED = 10;

export interface SendReportOptions {
    /** Nomi account email; include only with the user's consent. */
    accountEmail?: string;
    /**
     * The user's own words (not the full report with logs), kept locally so
     * the Tickets view can show their message next to the replies.
     */
    summary?: string;
}

export interface Ticket {
    id: string;
    summary: string;
    created: string;
    /** The complete report text that was sent (for "what was sent"). */
    info?: string;
}

/**
 * POST a bug report to the bugs endpoint. Resolves true on 2xx. The returned
 * report id is remembered locally so the popup can later fetch developer
 * replies for it.
 */
export async function sendReport(
    info: string,
    options: SendReportOptions = {},
): Promise<boolean> {
    try {
        const res = await fetch(BUGS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                info,
                accountEmail: options.accountEmail || undefined,
                installId: await getInstallId(),
                version: chrome.runtime.getManifest().version,
            }),
        });
        if (!res.ok) {
            Log("Bug report POST failed", res.status);
            return false;
        }
        const data = (await res.json().catch(() => null)) as {
            id?: string;
        } | null;
        if (data?.id) await trackReportId(data.id, options.summary, info);
        return true;
    } catch (err) {
        Log("Bug report POST threw", err);
        return false;
    }
}

async function trackReportId(
    id: string,
    summary?: string,
    info?: string,
): Promise<void> {
    try {
        const stored = await chrome.storage.local.get([IDS_KEY, TICKETS_KEY]);
        const ids = Array.isArray(stored[IDS_KEY]) ? stored[IDS_KEY] : [];
        const tickets: Ticket[] = Array.isArray(stored[TICKETS_KEY])
            ? stored[TICKETS_KEY]
            : [];
        tickets.push({
            id,
            summary: (summary ?? "").slice(0, 500),
            created: new Date().toISOString(),
            info,
        });
        await chrome.storage.local.set({
            [IDS_KEY]: [...ids, id].slice(-MAX_TRACKED),
            [TICKETS_KEY]: tickets.slice(-MAX_TRACKED),
        });
    } catch (err) {
        Log("Failed to remember report id", err);
    }
}

/** Locally remembered reports (the user's own messages), newest last. */
export async function getTickets(): Promise<Ticket[]> {
    try {
        const stored = await chrome.storage.local.get(TICKETS_KEY);
        return Array.isArray(stored[TICKETS_KEY]) ? stored[TICKETS_KEY] : [];
    } catch {
        return [];
    }
}

export type FollowUpError = "too_long" | "rate_limited" | "error";

/** POST a follow-up message on one of this install's reports. */
export async function sendFollowUp(
    reportId: string,
    text: string,
): Promise<{ ok: boolean; error?: FollowUpError }> {
    try {
        const res = await fetch(`${BUGS_ENDPOINT}/${reportId}/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });
        if (res.ok) return { ok: true };
        Log("Follow-up POST failed", res.status);
        if (res.status === 400 || res.status === 413) {
            return { ok: false, error: "too_long" };
        }
        if (res.status === 429) return { ok: false, error: "rate_limited" };
        return { ok: false, error: "error" };
    } catch (err) {
        Log("Follow-up POST threw", err);
        return { ok: false, error: "error" };
    }
}

/** Report ids this install has sent (newest last). */
export async function getReportIds(): Promise<string[]> {
    try {
        const stored = await chrome.storage.local.get(IDS_KEY);
        return Array.isArray(stored[IDS_KEY]) ? stored[IDS_KEY] : [];
    } catch {
        return [];
    }
}
