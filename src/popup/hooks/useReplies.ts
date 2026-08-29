import { useEffect, useState } from "react";
import { Log } from "../../utils/log";
import { BUGS_ENDPOINT } from "../../utils/report";
import { getReportIds } from "../report/sendReport";

const SEEN_KEY = "seenReplyIds";

export interface DevReply {
    id: string;
    reportId: string;
    text: string;
    created: string;
    author: "user" | "dev";
}

export type TicketStatus = "open" | "replied" | "resolved";

interface RepliesResult {
    replies: DevReply[];
    seen: string[];
    statuses: Record<string, TicketStatus>;
}

let cached: Promise<RepliesResult | null> | null = null;

/** One replies fetch per popup, shared by every consumer of the hook. */
function getRepliesOnce() {
    cached ??= fetchReplies();
    return cached;
}

/**
 * Records a follow-up the user just sent into the popup-wide cache (and
 * flips its report back to "open", mirroring the server), so reopening the
 * modal or remounting a consumer still shows it without a refetch.
 */
async function appendToCache(reply: DevReply): Promise<void> {
    const result = await getRepliesOnce();
    if (result) {
        result.replies.push(reply);
        result.statuses[reply.reportId] = "open";
    }
}

async function fetchReplies(): Promise<RepliesResult | null> {
    const ids = await getReportIds();
    if (ids.length === 0) return null;
    try {
        const stored = await chrome.storage.local.get(SEEN_KEY);
        const seen = Array.isArray(stored[SEEN_KEY]) ? stored[SEEN_KEY] : [];
        const res = await fetch(
            `${BUGS_ENDPOINT}/replies?ids=${ids.join(",")}`,
        );
        if (!res.ok) return null;
        const data = (await res.json()) as {
            replies?: DevReply[];
            reports?: Array<{ id: string; status: TicketStatus }>;
        };
        if (!Array.isArray(data.replies)) return null;
        const statuses: Record<string, TicketStatus> = {};
        for (const r of data.reports ?? []) statuses[r.id] = r.status;
        return { replies: data.replies, seen, statuses };
    } catch (err) {
        Log("Reply check failed", err);
        return null;
    }
}

/**
 * Developer replies to this install's bug reports. Fetched once per popup
 * (only when at least one report was ever sent); `unseen` drives the badge
 * and markSeen persists once the user has viewed them.
 */
export function useReplies(): {
    replies: DevReply[];
    statuses: Record<string, TicketStatus>;
    unseen: number;
    markSeen: () => void;
    /** Register a follow-up the user just sent (local echo + shared cache). */
    append: (reply: DevReply) => void;
} {
    const [replies, setReplies] = useState<DevReply[]>([]);
    const [statuses, setStatuses] = useState<Record<string, TicketStatus>>({});
    const [seen, setSeen] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        getRepliesOnce().then((result) => {
            if (cancelled || !result) return;
            setSeen(result.seen);
            setReplies(result.replies);
            setStatuses(result.statuses);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    // Only the developer's messages count as "new" — the user's own
    // follow-ups come back from the server too and must not ring the bell.
    const unseen = replies.filter(
        (r) => r.author === "dev" && !seen.includes(r.id),
    ).length;

    function markSeen() {
        const all = replies.map((r) => r.id);
        setSeen(all);
        chrome.storage.local.set({ [SEEN_KEY]: all }).catch(() => {});
    }

    function append(reply: DevReply) {
        setReplies((prev) => [...prev, reply]);
        setStatuses((prev) => ({ ...prev, [reply.reportId]: "open" }));
        appendToCache(reply);
    }

    return { replies, statuses, unseen, markSeen, append };
}
