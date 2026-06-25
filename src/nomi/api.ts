import { Log } from "../utils/log";
import { NomiError } from "./errors";
import { api } from "./http";
import type { NomiExistsProps } from "./interfaces/exists";
import type { GetMediasProps } from "./interfaces/getMedias";
import type { ApiMeResponse } from "./types/api.me";
import type { ApiDailyUsageResponse } from "./types/api.me.dailyUsage";
import type { ApiMindMapsGraphResponse } from "./types/api.mindMaps.nomis.id.graph";
import type {
    ApiMindMapsTermsResponse,
    MemoryTermItem,
} from "./types/api.mindMaps.nomis.id.memoryTerms";
import type { ApiNomisIdResponse } from "./types/api.nomis.id";
import type { ApiAnchorLooksResponse } from "./types/api.nomis.id.anchorLooks";
import type {
    ApiNomisMessagesResponse,
    Message,
    SelfieRequest,
} from "./types/api.nomis.id.chat";
import type {
    APINomisIDMediasResponse,
    Media,
} from "./types/api.nomis.id.medias";
import type { ApiSharedNotesResponse } from "./types/api.nomis.id.sharedNotes";

/** Read-only access to the nomi.ai API for a single Nomi. */
export class NomiApiClient {
    private async exists({ nomiId }: NomiExistsProps) {
        try {
            Log(`Checking if Nomi exists with ID: ${nomiId}`);
            await api.head(`nomis/${nomiId}`);

            return true;
        } catch {
            throw new NomiError({
                id: nomiId,
                message: `Nomi with ID ${nomiId} not found`,
            });
        }
    }

    public async get({ nomiId }: NomiExistsProps) {
        try {
            Log(`Getting Nomi with ID: ${nomiId}`);
            const { data } = await api.get<ApiNomisIdResponse>(
                `nomis/${nomiId}`,
            );
            return data;
        } catch {
            throw new NomiError({
                message: `Failed to get Nomi with ID ${nomiId}`,
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

    public async getMessages({ nomiId }: NomiExistsProps) {
        Log(`Getting messages for Nomi ID: ${nomiId}`);

        const exists = await this.exists({ nomiId });

        if (exists) {
            const messages: Message[] = [];
            const requests: SelfieRequest[] = [];

            let nextMax: string | undefined = "default";
            let url = `/nomis/${nomiId}/chat/messages`;

            try {
                while (nextMax) {
                    if (nextMax !== undefined && nextMax !== "default") {
                        url = `/nomis/${nomiId}/chat/messages?max=${nextMax}`;
                    }

                    const { data } =
                        await api.get<ApiNomisMessagesResponse>(url);

                    messages.push(...data.messages);
                    requests.push(...data.selfies);

                    nextMax = data.nextMax ?? undefined;
                }
            } catch (error) {
                Log(`Error fetching messages for Nomi ID ${nomiId}:`, error);
            }

            const sorted = [...messages, ...requests].sort((a, b) => {
                const dateA =
                    "sent" in a ? new Date(a.sent) : new Date(a.completed);
                const dateB =
                    "sent" in b ? new Date(b.sent) : new Date(b.completed);

                return dateA.getTime() - dateB.getTime();
            });

            return sorted;
        } else {
            throw new NomiError({
                id: nomiId,
                message: `Nomi with ID ${nomiId} does not exist`,
            });
        }
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
                        `[Scanning]: ${selfies.length} selfies found...`,
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

    public async getMindInfo({ nomiId }: NomiExistsProps) {
        try {
            const categories = ["Entity", "Keyword", "Goal"];
            const base = `mind-maps/nomis/${nomiId}`;
            const memoryUrl = `${base}/memory-terms`;
            const graphUrl = `${base}/graph`;

            const Terms: { category: string; items: MemoryTermItem[] }[] = [];

            const { data: Graph } = await api.get<ApiMindMapsGraphResponse>(
                `${graphUrl}`,
            );

            for (let i = 0; i < categories.length; i++) {
                const category = categories[i];

                const url = `${memoryUrl}?category=${category}`;

                const { data } = await api.get<ApiMindMapsTermsResponse>(url);

                Terms.push({ category, items: [] });

                for (const term of data.memoryTerms) {
                    const { data } = await api.get<MemoryTermItem>(
                        `${memoryUrl}/${term.uuid}`,
                    );
                    Terms[i].items.push(data);
                }
            }

            if (
                Graph.nodes.length === 0 &&
                Graph.edges.length === 0 &&
                Terms.every((t) => t.items.length === 0)
            ) {
                return null;
            }

            return {
                graph: Graph,
                terms: Terms,
            };
        } catch (error) {
            if (error instanceof NomiError) {
                Log(`NomiError: ${error.message}`);
            } else {
                Log("Unexpected error during mind info download:", error);
            }
            return null;
        }
    }
}
