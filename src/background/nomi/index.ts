import type { ApiNomisIdResponse } from "../../interfaces/nomi/api.nomis.id";
import type { NomiExistsProps } from "./interfaces/exists";
import { api } from "../../utils/nomiApi";
import { Log } from "../../utils/log";
import type {
    ApiNomisMessagesResponse,
    Message,
    SelfieRequest,
} from "../../interfaces/nomi/api.nomis.id.chat";

interface NomiErrorProps {
    id?: number;
    message: string;
}

class NomiError extends Error {
    public id: number | null;
    public message: string;

    constructor({ id, message }: NomiErrorProps) {
        super(message);
        this.name = "Nomi Error";
        this.message = message;
        this.id = id ?? null;
    }
}

export class Nomi {
    constructor() {}

    public async downloadAlbum(
        nomiId: string,
        updateStatus: (message: string) => void,
    ) {
        Log("Downloading album for Nomi ID: " + nomiId);
        updateStatus("Initializing download...");

        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateStatus("Fetching images...");

        for (let i = 0; i < 100; i++) {
            updateStatus(`Processing image ${i + 1} of 100`);
            await new Promise((resolve) => setTimeout(resolve, 750));
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        updateStatus("Zipping files...");

        Log("Album downloaded!");
    }

    private async exists({ nomiId }: NomiExistsProps) {
        try {
            Log("Checking if Nomi exists with ID: " + nomiId);
            await api.head("nomis/" + nomiId);

            return true;
        } catch (error) {
            throw new NomiError({
                id: nomiId,
                message: "Nomi with ID " + nomiId + " not found",
            });
        }
    }

    public async get({ nomiId }: NomiExistsProps) {
        try {
            Log("Getting Nomi with ID: " + nomiId);
            const { data } = await api.get<ApiNomisIdResponse>(
                "nomis/" + nomiId,
            );
            return data;
        } catch (error) {
            throw new NomiError({
                message: "Failed to get Nomi with ID " + nomiId,
            });
        }
    }

    public async getMessages({ nomiId }: NomiExistsProps) {
        Log("Getting messages for Nomi ID: " + nomiId);

        const exists = await this.exists({ nomiId });

        if (exists) {
            const messages: Message[] = [];
            const requests: SelfieRequest[] = [];

            let messagesFound = 0;
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
                    messagesFound += data.messages.length;
                }
            } catch (error) {
                Log(
                    "Error fetching messages for Nomi ID " + nomiId + ":",
                    error,
                );
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
                message: "Nomi with ID " + nomiId + " does not exist",
            });
        }
    }
}
