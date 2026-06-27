import type { NomiApiClient } from "../../nomi/api";
import { NomiError } from "../../nomi/errors";
import { api } from "../../nomi/http";
import type { DownloadGroupChatProps } from "../../nomi/interfaces/downloadGroupChat";
import type {
    GroupMessage,
    GroupSelfieRequest,
} from "../../nomi/types/api.groupChats.id.messages";
import { Log } from "../../utils/log";
import type { ChatItem } from "./chat/types";
import { chunkBySize } from "./chunk";
import {
    BLOB_URL_REVOKE_DELAY_MS,
    CHAT_CHUNK_MAX_BYTES_TEXT,
    CHAT_CHUNK_MAX_BYTES_WITH_SELFIES,
    DOWNLOAD_THROTTLE_MS,
    MESSAGE_BYTES,
    SELFIE_BYTES,
    SELFIE_DOWNLOAD_TIMEOUT_MS,
} from "./constants";
import type { OffscreenClient } from "./offscreenClient";

const SELFIE_EXTENSION = "webp";

type GroupItem = GroupMessage | GroupSelfieRequest;

/** Downloads a group chat's history as one or more standalone HTML files. */
export class GroupChatDownloader {
    constructor(
        private readonly nomiApi: NomiApiClient,
        private readonly offscreen: OffscreenClient,
    ) {}

    async run({
        groupId,
        name,
        includeSelfies,
        maxMessages = 0,
        onProgress,
    }: DownloadGroupChatProps) {
        const update = (message: string) => onProgress?.(message);

        try {
            Log(`Downloading chat for group ID: ${groupId}`);
            // Offscreen renders the HTML (it has a DOM); ensure it exists first.
            await this.offscreen.setupDocument();

            const all = await this.nomiApi.getGroupMessages({ groupId });

            if (!all || all.length === 0) {
                throw new NomiError({
                    id: groupId,
                    message: `No messages found for group with ID ${groupId}`,
                });
            }

            // Keep only the last N items when a cap is set (0 = unlimited).
            const messages = maxMessages > 0 ? all.slice(-maxMessages) : all;

            const stringDate = new Date().toDateString().replace(/ /g, "-");

            update(`Scanning messages: ${messages.length} found`);

            const chunks = chunkBySize(
                messages,
                (item) => this.estimateItemSize(item, includeSelfies),
                includeSelfies
                    ? CHAT_CHUNK_MAX_BYTES_WITH_SELFIES
                    : CHAT_CHUNK_MAX_BYTES_TEXT,
            );

            update(`Downloading ${messages.length} messages... 0%`);

            let lastPercent = "0";
            let messagesCount = 0;
            let currentMessageIndex = 0;

            for (let j = 0; j < chunks.length; j++) {
                const chunk = chunks[j];
                const items: ChatItem[] = [];

                for (let i = 0; i < chunk.length; i++) {
                    const element = chunk[i];
                    const isMessage = "sent" in element;

                    const percentage = (
                        ((messagesCount + 1) / messages.length) *
                        100
                    ).toFixed(0);

                    if (percentage !== lastPercent) {
                        update(`Downloading messages... ${percentage}%`);
                    }
                    lastPercent = percentage;
                    messagesCount++;

                    if (isMessage) {
                        const message = element as GroupMessage;
                        // The user's own messages have no nomiId.
                        const isNomi = message.nomiId != null;
                        items.push({
                            kind: "message",
                            isNomi,
                            text: message.text,
                            sent: message.sent,
                            name: isNomi ? message.nomiName : undefined,
                        });
                    } else if (includeSelfies) {
                        const request = element as GroupSelfieRequest;
                        items.push(...(await this.fetchSelfies(request)));
                    }
                }

                const chatHtml = await this.offscreen.renderChat({
                    name,
                    items,
                });

                const { url, isBlob } = await this.toDownloadUrl(chatHtml);

                const nameSafe = name.replace(/ /g, "-");
                let fileName = `${nameSafe}_GroupChat(${messages.length})_${stringDate}.html`;
                if (chunks.length > 1) {
                    const start = currentMessageIndex + 1;
                    const end = currentMessageIndex + chunk.length;
                    fileName = `${nameSafe}_GroupChat(${start}-${end})_${stringDate}_Part${j + 1}.html`;
                }

                await chrome.downloads.download({
                    url,
                    filename: fileName,
                    saveAs: false,
                });

                await new Promise((resolve) =>
                    setTimeout(resolve, DOWNLOAD_THROTTLE_MS),
                );

                if (isBlob) {
                    // Delay revoke so the download has time to start.
                    setTimeout(() => {
                        this.offscreen.call("revoke-blob-url", { url });
                    }, BLOB_URL_REVOKE_DELAY_MS);
                }

                currentMessageIndex += chunk.length;
            }

            update(`Downloaded ${messages.length} messages`);
        } catch (error) {
            if (error instanceof NomiError) {
                Log(`NomiError: ${error.message}`);
                update(`Error: ${error.message}`);
            } else {
                Log("Unexpected error during group chat download:", error);
                update("Unexpected error during group chat download.");
            }
        }
    }

    private estimateItemSize(
        item: GroupItem,
        includeSelfies?: boolean,
    ): number {
        if ("sent" in item) return MESSAGE_BYTES;
        return includeSelfies ? item.selfies.length * SELFIE_BYTES : 0;
    }

    private async fetchSelfies(
        request: GroupSelfieRequest,
    ): Promise<ChatItem[]> {
        const items: ChatItem[] = [];
        for (const selfie of request.selfies) {
            const url = `/selfie-requests/${request.id}/images/${selfie.id}.${SELFIE_EXTENSION}`;
            try {
                const { data } = await api.get(url, {
                    responseType: "blob",
                    timeout: SELFIE_DOWNLOAD_TIMEOUT_MS,
                });
                const base64 = await this.offscreen.blobToBase64(data);
                items.push({
                    kind: "selfie",
                    src: `data:image/${SELFIE_EXTENSION};base64,${base64}`,
                });
            } catch (err) {
                Log(`Failed to fetch group selfie ${selfie.id}`, err);
                items.push({ kind: "failed" });
            }
        }
        return items;
    }

    private async toDownloadUrl(
        chatHtml: string,
    ): Promise<{ url: string; isBlob: boolean }> {
        try {
            await this.offscreen.setupDocument();
            const res = await this.offscreen.call("create-blob-url", {
                content: chatHtml,
                type: "text/html",
            });
            if (res?.success && res.url) {
                return { url: res.url, isBlob: true };
            }
        } catch {
            // fall through to data URI
        }

        const base64Chat = btoa(unescape(encodeURIComponent(chatHtml)));
        return { url: `data:text/html;base64,${base64Chat}`, isBlob: false };
    }
}
