import { createElement, type ReactNode } from "react";
import type { NomiApiClient } from "../../nomi/api";
import { NomiError } from "../../nomi/errors";
import { api } from "../../nomi/http";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type {
    Message,
    SelfieRequest,
} from "../../nomi/types/api.nomis.id.chat";
import { Log } from "../../utils/log";
import {
    ChatImageFailed,
    ChatMessage as ChatMessageView,
    ChatSelfie,
    renderChatDocument,
} from "./chat/ChatDocument";
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

/** Downloads a Nomi's chat history as one or more standalone HTML files. */
export class ChatDownloader {
    constructor(
        private readonly nomiApi: NomiApiClient,
        private readonly offscreen: OffscreenClient,
    ) {}

    async run({
        nomiId,
        includeSelfies,
        maxMessages = 0,
        onProgress,
    }: DownloadChatProps) {
        const update = (message: string) => onProgress?.(message);

        try {
            Log(`Downloading chat for Nomi ID: ${nomiId}`);
            const nomi = await this.nomiApi.get({ nomiId });
            const all = await this.nomiApi.getMessages({ nomiId });

            if (!all || all.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: `No messages found for Nomi with ID ${nomiId}`,
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
                const nodes: ReactNode[] = [];

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
                        const message = element as Message;
                        const isNomi =
                            message.type === "Nomi" ||
                            message.type === "NomiStarter";
                        nodes.push(
                            createElement(ChatMessageView, {
                                key: `m-${i}`,
                                isNomi,
                                text: message.text,
                                date: new Date(message.sent),
                            }),
                        );
                    } else if (includeSelfies) {
                        const request = element as SelfieRequest;
                        nodes.push(...(await this.renderSelfies(request, i)));
                    }
                }

                const chatHtml = renderChatDocument(nodes);

                // Prefer an offscreen Blob URL (safer for big strings); fall
                // back to a base64 data URI if offscreen is unavailable.
                const { url, isBlob } = await this.toDownloadUrl(chatHtml);

                const nomiNameSafe = nomi.name.replace(/ /g, "-");
                let fileName = `${nomiNameSafe}_Chat(${messages.length})_${stringDate}.html`;
                if (chunks.length > 1) {
                    const start = currentMessageIndex + 1;
                    const end = currentMessageIndex + chunk.length;
                    fileName = `${nomiNameSafe}_Chat(${start}-${end})_${stringDate}_Part${j + 1}.html`;
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
                    // Delay revoke so the download has time to start
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
                Log("Unexpected error during chat download:", error);
                update("Unexpected error during chat download.");
            }
        }
    }

    private estimateItemSize(
        item: Message | SelfieRequest,
        includeSelfies?: boolean,
    ): number {
        if ("sent" in item) return MESSAGE_BYTES;
        return includeSelfies ? item.selfies.length * SELFIE_BYTES : 0;
    }

    private async renderSelfies(
        request: SelfieRequest,
        index: number,
    ): Promise<ReactNode[]> {
        const nodes: ReactNode[] = [];
        for (let s = 0; s < request.selfies.length; s++) {
            const selfie = request.selfies[s];
            const url = `/selfie-requests/${request.id}/images/${selfie.id}.${SELFIE_EXTENSION}`;
            const key = `s-${index}-${s}`;
            try {
                const { data } = await api.get(url, {
                    responseType: "blob",
                    timeout: SELFIE_DOWNLOAD_TIMEOUT_MS,
                });
                const base64 = await this.offscreen.blobToBase64(data);
                nodes.push(
                    createElement(ChatSelfie, {
                        key,
                        src: `data:image/${SELFIE_EXTENSION};base64,${base64}`,
                    }),
                );
            } catch (err) {
                Log(`Failed to fetch selfie ${selfie.id}`, err);
                nodes.push(createElement(ChatImageFailed, { key }));
            }
        }
        return nodes;
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
