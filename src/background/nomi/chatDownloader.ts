import type { NomiApiClient } from "../../nomi/api";
import { NomiError } from "../../nomi/errors";
import { api } from "../../nomi/http";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type {
    Message,
    SelfieRequest,
} from "../../nomi/types/api.nomis.id.chat";
import { Log } from "../../utils/log";
import type { ChatItem } from "./chat/types";
import { chunkBySize } from "./chunk";
import {
    CHAT_CHUNK_MAX_BYTES_TEXT,
    CHAT_CHUNK_MAX_BYTES_WITH_SELFIES,
    DOWNLOAD_THROTTLE_MS,
    MESSAGE_BYTES,
    SELFIE_BYTES,
    SELFIE_DOWNLOAD_TIMEOUT_MS,
} from "./constants";
import { fetchHeaderMedia } from "./headerMedia";
import { applyMessageRange } from "./messageRange";
import type { OffscreenClient } from "./offscreenClient";

const SELFIE_EXTENSION = "webp";

/** Downloads a Nomi's chat history as one or more standalone HTML files. */
export class ChatDownloader {
    constructor(
        private readonly nomiApi: NomiApiClient,
        private readonly offscreen: OffscreenClient,
        private readonly embedHeaderVideo = false,
    ) {}

    async run({
        nomiId,
        includeSelfies,
        maxMessages = 0,
        rangeStart = 0,
        rangeEnd = 0,
        messagesPerFile = 0,
        maxFileSizeMB = 0,
        onProgress,
    }: DownloadChatProps) {
        const update = (message: string) => onProgress?.(message);

        try {
            Log(`Downloading chat for Nomi ID: ${nomiId}`);
            // Offscreen renders the HTML (it has a DOM); ensure it exists first.
            await this.offscreen.setupDocument();

            const nomi = await this.nomiApi.get({ nomiId });
            const all = await this.nomiApi.getMessages({ nomiId });

            if (!all || all.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: `No messages found for Nomi with ID ${nomiId}`,
                });
            }

            // An explicit From→To range wins; otherwise fall back to last-N.
            const messages = applyMessageRange(
                all,
                rangeStart,
                rangeEnd,
                maxMessages,
            );

            // Embed the avatar/video as data URIs so the header works offline.
            const { avatar, avatarVideo } = await fetchHeaderMedia(
                nomi,
                this.offscreen,
                this.embedHeaderVideo,
            );

            const stringDate = new Date().toDateString().replace(/ /g, "-");

            update(`Scanning messages: ${messages.length} found`);

            // A file closes when either limit is hit. The byte cap defaults to
            // the built-in safe value (selfie-heavy files allow more); an
            // optional "messages per file" caps the count on top of it.
            const maxBytes =
                maxFileSizeMB > 0
                    ? maxFileSizeMB * 1024 * 1024
                    : includeSelfies
                      ? CHAT_CHUNK_MAX_BYTES_WITH_SELFIES
                      : CHAT_CHUNK_MAX_BYTES_TEXT;
            const maxCount =
                messagesPerFile > 0
                    ? messagesPerFile
                    : Number.POSITIVE_INFINITY;
            const chunks = chunkBySize(
                messages,
                (item) => this.estimateItemSize(item, includeSelfies),
                maxBytes,
                maxCount,
            );

            update(`Downloading ${messages.length} messages... 0%`);

            let lastPercent = "0";
            let messagesCount = 0;
            let currentMessageIndex = 0;
            let saveNote: string | undefined;

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
                        update(
                            includeSelfies
                                ? `Collecting messages & selfies… ${percentage}%`
                                : `Collecting messages… ${percentage}%`,
                        );
                    }
                    lastPercent = percentage;
                    messagesCount++;

                    if (isMessage) {
                        const message = element as Message;
                        const isNomi =
                            message.type === "Nomi" ||
                            message.type === "NomiStarter";
                        items.push({
                            kind: "message",
                            isNomi,
                            text: message.text,
                            sent: message.sent,
                        });
                    } else if (includeSelfies) {
                        const request = element as SelfieRequest;
                        items.push(...(await this.fetchSelfies(request)));
                    }
                }

                update(
                    chunks.length > 1
                        ? `Building chat file ${j + 1}/${chunks.length}…`
                        : "Building chat file…",
                );
                const chatHtml = await this.offscreen.renderChat({
                    name: nomi.name,
                    avatar,
                    avatarVideo,
                    items,
                });

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

                const res = await this.offscreen.download(
                    url,
                    fileName,
                    { isBlob },
                    update,
                );
                if (res.note) saveNote = res.note;

                await new Promise((resolve) =>
                    setTimeout(resolve, DOWNLOAD_THROTTLE_MS),
                );

                currentMessageIndex += chunk.length;
            }

            update(`Downloaded ${messages.length} messages`);
            return saveNote;
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

    private async fetchSelfies(request: SelfieRequest): Promise<ChatItem[]> {
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
                Log(`Failed to fetch selfie ${selfie.id}`, err);
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
