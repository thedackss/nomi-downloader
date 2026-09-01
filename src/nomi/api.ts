import axios from "axios";
import { Log } from "../utils/log";
import { NomiError } from "./errors";
import { api } from "./http";
import type { NomiExistsProps } from "./interfaces/exists";
import type { GetMediasProps } from "./interfaces/getMedias";
import type {
    ApiGroupMessagesResponse,
    GroupMessage,
    GroupSelfieRequest,
} from "./types/api.groupChats.id.messages";
import type { ApiMeResponse } from "./types/api.me";
import type { ApiDailyUsageResponse } from "./types/api.me.dailyUsage";
import type { ApiMindMapsGraphResponse } from "./types/api.mindMaps.nomis.id.graph";
import type {
    ApiMindMapsTermsResponse,
    MemoryTerm,
    MemoryTermItem,
} from "./types/api.mindMaps.nomis.id.memoryTerms";
import type { ApiNomisIdResponse } from "./types/api.nomis.id";
import type { ApiAnchorLooksResponse } from "./types/api.nomis.id.anchorLooks";
import type {
    ApiNomisMessagesResponse,
    Message,
    SelfieRequest,
    VoiceCall,
} from "./types/api.nomis.id.chat";
import type {
    APINomisIDMediasResponse,
    Media,
} from "./types/api.nomis.id.medias";
import type { ApiSharedNotesResponse } from "./types/api.nomis.id.sharedNotes";
import type {
    ApiVoiceCallMessagesResponse,
    VoiceCallWithMessages,
} from "./types/api.nomis.id.voiceCalls";

/** Everything getMessages returns: the timeline items plus voice calls. */
export interface NomiChatFeed {
    items: (Message | SelfieRequest)[];
    voiceCalls: VoiceCallWithMessages[];
}

const RETRY_ATTEMPTS = 3;

/** " (HTTP 404)" style suffix from an axios error, for diagnosable messages. */
function statusSuffix(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (error.response) return ` (HTTP ${error.response.status})`;
        if (error.code) return ` (${error.code})`; // e.g. ECONNABORTED, ERR_NETWORK
    }
    return "";
}

/**
 * GET with retries and backoff. Long exports fire hundreds of sequential
 * requests, so a single rate-limit blip or timeout used to sink the whole
 * run; retrying absorbs the transient ones.
 */
async function getRetry<T>(url: string, timeoutMs?: number): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
        try {
            const { data } = await api.get<T>(
                url,
                timeoutMs ? { timeout: timeoutMs } : undefined,
            );
            return data;
        } catch (error) {
            lastError = error;
            if (attempt < RETRY_ATTEMPTS - 1) {
                const delay = 800 * 2 ** attempt + Math.random() * 400;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

/** Map with at most `limit` calls in flight, preserving order. */
async function mapLimit<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const workers = Array.from(
        { length: Math.min(limit, items.length) },
        async () => {
            while (next < items.length) {
                const i = next++;
                results[i] = await fn(items[i]);
            }
        },
    );
    await Promise.all(workers);
    return results;
}

const MIND_CATEGORIES = ["Entity", "Keyword", "Goal"];

/** Old graphs can be big; give the graph endpoint more room than the default. */
const GRAPH_TIMEOUT_MS = 30_000;

/** Parallel memory-term detail fetches; low to stay clear of rate limits. */
const TERM_CONCURRENCY = 4;

/**
 * True once a page of messages reaches the incremental cutoff. Pages arrive
 * newest → oldest, so the first page containing anything at or older than the
 * cutoff is the last one worth fetching.
 */
export function reachesCutoff(messages: Message[], cutoffMs: number): boolean {
    return messages.some((message) => {
        const ms = new Date(message.sent).getTime();
        return !Number.isNaN(ms) && ms <= cutoffMs;
    });
}

/** Read-only access to the nomi.ai API for a single Nomi. */
export class NomiApiClient {
    private async exists({ nomiId }: NomiExistsProps) {
        try {
            Log(`Checking if Nomi exists with ID: ${nomiId}`);
            await api.head(`nomis/${nomiId}`);

            return true;
        } catch (error) {
            throw new NomiError({
                id: nomiId,
                message: `Nomi with ID ${nomiId} not found${statusSuffix(error)}`,
            });
        }
    }

    public async get({ nomiId }: NomiExistsProps) {
        try {
            Log(`Getting Nomi with ID: ${nomiId}`);
            // Retried: a single transient blip here used to abort the whole
            // download before anything was fetched.
            return await getRetry<ApiNomisIdResponse>(`nomis/${nomiId}`);
        } catch (error) {
            // Include the HTTP status so a report distinguishes a deleted or
            // inaccessible Nomi (404/403) from a server or network failure.
            throw new NomiError({
                message: `Failed to get Nomi with ID ${nomiId}${statusSuffix(error)}`,
            });
        }
    }

    public async getSharedNotes({ nomiId }: NomiExistsProps) {
        try {
            Log(`Getting shared notes for Nomi with ID: ${nomiId}`);
            const { data } = await api.get<ApiSharedNotesResponse>(
                `nomis/${nomiId}/shared-notes`,
            );
            return data;
        } catch (error) {
            Log("Failed to get shared notes", error);
            return null;
        }
    }

    public async getAnchorLooks({ nomiId }: NomiExistsProps) {
        try {
            Log(`Getting anchor looks for Nomi with ID: ${nomiId}`);
            const { data } = await api.get<ApiAnchorLooksResponse>(
                `nomis/${nomiId}/anchor-looks`,
            );
            return data;
        } catch (error) {
            Log("Failed to get anchor looks", error);
            return null;
        }
    }

    public async getUserInfo() {
        try {
            Log("Getting user info");
            const { data } = await api.get<ApiMeResponse>("me");
            return data;
        } catch {
            throw new NomiError({ message: "Failed to get user info" });
        }
    }

    public async getDailyUsage() {
        try {
            Log("Getting daily usage counts");
            const { data } = await api.get<ApiDailyUsageResponse>(
                "me/daily-usage-counts",
            );
            return data.dailyUsageCounts;
        } catch {
            throw new NomiError({ message: "Failed to get daily usage" });
        }
    }

    public async getMessages({
        nomiId,
        onProgress,
        since,
    }: NomiExistsProps & {
        onProgress?: (found: number) => void;
        /**
         * Incremental fetch: stop paginating once a page reaches messages at
         * or older than this ISO timestamp. Pages run newest → oldest, so by
         * then every newer message has been collected. The final page straddles
         * the cutoff, so callers still filter what they get back.
         */
        since?: string;
    }): Promise<NomiChatFeed> {
        Log(`Getting messages for Nomi ID: ${nomiId}`);

        const exists = await this.exists({ nomiId });

        if (exists) {
            const messages: Message[] = [];
            const requests: SelfieRequest[] = [];
            const calls = new Map<string, VoiceCall>();

            const cutoff = since ? new Date(since).getTime() : Number.NaN;
            const hasCutoff = !Number.isNaN(cutoff);

            let nextMax: string | undefined = "default";
            let url = `/nomis/${nomiId}/chat/messages`;

            try {
                while (nextMax) {
                    if (nextMax !== undefined && nextMax !== "default") {
                        url = `/nomis/${nomiId}/chat/messages?max=${nextMax}`;
                    }

                    const data = await getRetry<ApiNomisMessagesResponse>(url);

                    messages.push(...data.messages);
                    requests.push(...data.selfies);
                    for (const call of data.voiceCalls ?? []) {
                        calls.set(call.id, call);
                    }
                    onProgress?.(messages.length + requests.length);

                    // Incremental: this page already reaches past the cutoff,
                    // so everything newer is in hand — stop instead of walking
                    // the rest of the history.
                    if (hasCutoff && reachesCutoff(data.messages, cutoff)) {
                        Log(`Incremental: stopped paginating at ${since}`);
                        break;
                    }

                    const next = data.nextMax ?? undefined;
                    // Stop on an empty page or a non-advancing cursor so a
                    // misbehaving API can't spin this loop forever.
                    if (data.messages.length === 0 || next === nextMax) break;
                    nextMax = next;
                }
            } catch (error) {
                // A mid-pagination failure (after retries) used to be
                // swallowed here, exporting a silently truncated chat; fail
                // honestly instead so the user sees an error, not a bad file.
                Log(`Error fetching messages for Nomi ID ${nomiId}:`, error);
                throw new NomiError({
                    id: nomiId,
                    message: `Chat fetch failed after ${messages.length} messages`,
                });
            }

            const sorted = [...messages, ...requests].sort((a, b) => {
                const dateA =
                    "sent" in a ? new Date(a.sent) : new Date(a.completed);
                const dateB =
                    "sent" in b ? new Date(b.sent) : new Date(b.completed);

                return dateA.getTime() - dateB.getTime();
            });

            const voiceCalls = await this.getVoiceCallTranscripts(nomiId, [
                ...calls.values(),
            ]);

            return { items: sorted, voiceCalls };
        } else {
            throw new NomiError({
                id: nomiId,
                message: `Nomi with ID ${nomiId} does not exist`,
            });
        }
    }

    /**
     * Attach each call's transcript. A failed fetch keeps the call with an
     * empty transcript so the export still marks that a call happened.
     */
    private async getVoiceCallTranscripts(
        nomiId: number,
        calls: VoiceCall[],
    ): Promise<VoiceCallWithMessages[]> {
        const result: VoiceCallWithMessages[] = [];
        for (const call of calls) {
            try {
                const data = await getRetry<ApiVoiceCallMessagesResponse>(
                    `/nomis/${nomiId}/voice-calls/${call.id}/messages`,
                );
                result.push({ ...call, messages: data.voiceCallMessages });
            } catch (error) {
                Log(`Error fetching voice call ${call.id}:`, error);
                result.push({ ...call, messages: [] });
            }
        }
        return result.sort(
            (a, b) =>
                new Date(a.started).getTime() - new Date(b.started).getTime(),
        );
    }

    public async getGroupMessages({
        groupId,
        onProgress,
    }: {
        groupId: number;
        onProgress?: (found: number) => void;
    }) {
        Log(`Getting messages for group ID: ${groupId}`);

        const messages: GroupMessage[] = [];
        const requests: GroupSelfieRequest[] = [];

        // Pages walk backwards via a maxDate cursor ("default" = first page).
        let nextMaxDate: string | undefined = "default";
        let url = `/group-chats/${groupId}/messages`;

        try {
            while (nextMaxDate) {
                if (nextMaxDate !== "default") {
                    url = `/group-chats/${groupId}/messages?maxDate=${nextMaxDate}`;
                }

                const data = await getRetry<ApiGroupMessagesResponse>(url);

                messages.push(...data.messages);
                requests.push(...data.selfies);
                onProgress?.(messages.length + requests.length);

                const next = data.nextMaxDate ?? undefined;
                // Stop on an empty page or a non-advancing cursor so a
                // misbehaving API can't spin this loop forever.
                if (data.messages.length === 0 || next === nextMaxDate) break;
                nextMaxDate = next;
            }
        } catch (error) {
            Log(`Error fetching messages for group ID ${groupId}:`, error);
        }

        return [...messages, ...requests].sort((a, b) => {
            const dateA =
                "sent" in a ? new Date(a.sent) : new Date(a.completed);
            const dateB =
                "sent" in b ? new Date(b.sent) : new Date(b.completed);

            return dateA.getTime() - dateB.getTime();
        });
    }

    public async getMedias({ nomiId, onProgress }: GetMediasProps) {
        Log(`Getting media for Nomi ID: ${nomiId}`);

        const exists = await this.exists({ nomiId });

        const mediasUrl = `/nomis/${nomiId}/medias`;

        if (exists) {
            const { data } = await api.get<APINomisIDMediasResponse>(mediasUrl);

            const totalPages = data.maxPages;
            const selfies: Media[] = [];

            for (let i = 1; i <= totalPages; i++) {
                const url = `${mediasUrl}?page=${i}`;

                const { data } = await api.get<APINomisIDMediasResponse>(url);
                selfies.push(...data.medias);

                if (onProgress) {
                    onProgress(
                        `Scanning album — page ${i}/${totalPages}, ${selfies.length} items found…`,
                    );
                }
            }

            return selfies.sort((a, b) => {
                const dateA = new Date(a.completed);
                const dateB = new Date(b.completed);

                return dateA.getTime() - dateB.getTime();
            });
        } else {
            throw new NomiError({
                id: nomiId,
                message: `Nomi with ID ${nomiId} does not exist`,
            });
        }
    }

    /**
     * The full mind map: graph plus every memory term's dossier. Big maps mean
     * hundreds of term requests, so everything is retried, term lists are
     * walked through all their pages (page 1 alone used to silently truncate
     * old Nomis), and a term whose detail fetch keeps failing falls back to
     * its list entry instead of sinking the whole map. Returns null only when
     * the map is genuinely empty; throws when nothing could be fetched at all,
     * so callers can tell "no mind map" from "the fetch failed".
     */
    public async getMindInfo({
        nomiId,
        onProgress,
    }: NomiExistsProps & { onProgress?: (message: string) => void }) {
        const base = `mind-maps/nomis/${nomiId}`;
        const memoryUrl = `${base}/memory-terms`;

        let graph: ApiMindMapsGraphResponse = { nodes: [], edges: [] };
        let graphOk = false;
        try {
            graph = await getRetry<ApiMindMapsGraphResponse>(
                `${base}/graph`,
                GRAPH_TIMEOUT_MS,
            );
            graphOk = true;
        } catch (error) {
            Log("Mind map graph fetch failed", error);
        }

        const Terms: { category: string; items: MemoryTermItem[] }[] = [];
        let listsOk = false;
        let fetched = 0;

        for (const category of MIND_CATEGORIES) {
            let terms: MemoryTerm[] = [];
            try {
                terms = await this.getAllTerms(memoryUrl, category);
                listsOk = true;
            } catch (error) {
                Log(`Mind map ${category} term list fetch failed`, error);
            }

            const items = await mapLimit(terms, TERM_CONCURRENCY, (term) => {
                fetched++;
                if (fetched % 20 === 0) {
                    onProgress?.(`Fetching mind map: ${fetched} terms…`);
                }
                return this.getTermDetail(memoryUrl, term);
            });
            Terms.push({ category, items });
        }

        if (!graphOk && !listsOk) {
            throw new NomiError({
                id: nomiId,
                message: `Failed to fetch the mind map for Nomi ${nomiId}`,
            });
        }

        if (
            graph.nodes.length === 0 &&
            graph.edges.length === 0 &&
            Terms.every((t) => t.items.length === 0)
        ) {
            return null;
        }

        return { graph, terms: Terms };
    }

    /** Every term in a category, following the list's pagination. */
    private async getAllTerms(
        memoryUrl: string,
        category: string,
    ): Promise<MemoryTerm[]> {
        const listUrl = `${memoryUrl}?category=${category}`;
        const first = await getRetry<ApiMindMapsTermsResponse>(listUrl);

        const terms = [...first.memoryTerms];
        const seen = new Set(terms.map((t) => t.uuid));

        for (let page = first.page + 1; page <= first.totalPages; page++) {
            const next = await getRetry<ApiMindMapsTermsResponse>(
                `${listUrl}&page=${page}`,
            );
            // Only-new guard: if the page param were ignored the same page
            // would come back forever; unseen terms are the loop's fuel.
            const fresh = next.memoryTerms.filter((t) => !seen.has(t.uuid));
            if (fresh.length === 0) break;
            for (const t of fresh) seen.add(t.uuid);
            terms.push(...fresh);
        }

        return terms;
    }

    /**
     * One term's full detail (the dossier). When it keeps failing, degrade to
     * the list entry with an empty dossier: a slightly thinner term beats
     * reporting the whole Nomi as having no mind map.
     */
    private async getTermDetail(
        memoryUrl: string,
        term: MemoryTerm,
    ): Promise<MemoryTermItem> {
        try {
            return await getRetry<MemoryTermItem>(`${memoryUrl}/${term.uuid}`);
        } catch (error) {
            Log(
                `Mind map term ${term.uuid} fetch failed; using summary`,
                error,
            );
            return {
                ...term,
                category: String(term.category),
                priority: String(term.priority),
                state: String(term.state),
                created: String(term.created),
                aiEdited: String(term.aiEdited),
                dossier: "",
            };
        }
    }

    /**
     * Cheap "does a mind map exist" check for the popup: the graph plus the
     * three term-list heads (four requests), never the per-term details. On
     * fetch failure it answers true so the button stays usable; an actual
     * download will surface a real error instead of a wrong "no mind map".
     */
    public async hasMindMap({ nomiId }: NomiExistsProps): Promise<boolean> {
        const base = `mind-maps/nomis/${nomiId}`;
        try {
            const graph = await getRetry<ApiMindMapsGraphResponse>(
                `${base}/graph`,
                GRAPH_TIMEOUT_MS,
            );
            if (graph.nodes.length > 0 || graph.edges.length > 0) return true;

            for (const category of MIND_CATEGORIES) {
                const list = await getRetry<ApiMindMapsTermsResponse>(
                    `${base}/memory-terms?category=${category}`,
                );
                if (list.totalCount > 0 || list.memoryTerms.length > 0) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            Log("Mind map presence check failed; assuming one exists", error);
            return true;
        }
    }
}
