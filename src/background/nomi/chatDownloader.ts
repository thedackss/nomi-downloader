import type { NomiApiClient, NomiChatFeed } from "../../nomi/api";
import { NomiError } from "../../nomi/errors";
import { api } from "../../nomi/http";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type {
    Message,
    SelfieRequest,
} from "../../nomi/types/api.nomis.id.chat";
import type { VoiceCallWithMessages } from "../../nomi/types/api.nomis.id.voiceCalls";
import { Log } from "../../utils/log";
import { type BundleFileSink, BundleSink } from "./bundle/sink";
import { fetchVoiceAudio, voiceAudioPathMap } from "./bundle/voiceAudio";
import type { ChatItem } from "./chat/types";
import { chunkBySize } from "./chunk";
import {
    CHAT_CHUNK_MAX_BYTES_TEXT,
    CHAT_CHUNK_MAX_BYTES_WITH_SELFIES,
    CHAT_ZIP_MAX_BYTES,
    DOWNLOAD_THROTTLE_MS,
    MESSAGE_BYTES,
    SELFIE_BYTES,
    SELFIE_DOWNLOAD_TIMEOUT_MS,
} from "./constants";
import { fetchHeaderMedia } from "./headerMedia";
import {
    filterNewerThan,
    getLastTimestamp,
    newestTimestamp,
    setLastTimestamp,
} from "./incrementalStore";
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
        maxZipSizeMB = 0,
        incremental = false,
        includeVoiceAudio = false,
        voiceAudioRecentLimit = 0,
        onProgress,
        prefetched,
        emit,
        audioSink,
    }: DownloadChatProps & {
        /** Reuse an already-fetched chat feed instead of fetching again. */
        prefetched?: NomiChatFeed;
        /**
         * Bundle mode: receive each rendered file (chat.html /
         * chat_partN.html) instead of downloading it.
         */
        emit?: (filename: string, html: string) => Promise<void>;
        /** Bundle mode: where voice audio files go (paths under voice/). */
        audioSink?: BundleFileSink;
    }) {
        const update = (message: string) => onProgress?.(message);

        try {
            Log(`Downloading chat for Nomi ID: ${nomiId}`);
            // Offscreen renders the HTML (it has a DOM); ensure it exists first.
            await this.offscreen.setupDocument();

            const nomi = await this.nomiApi.get({ nomiId });
            // Resolve the incremental cutoff first so the fetch can stop early
            // instead of paging the whole history just to discard it below.
            const lastTs = incremental
                ? await getLastTimestamp("chat", nomiId)
                : undefined;
            const { items, voiceCalls } =
                prefetched ??
                (await this.nomiApi.getMessages({
                    nomiId,
                    since: lastTs,
                    onProgress: (found) =>
                        update(`Scanning messages: ${found} found`),
                }));

            // Voice calls join the timeline, positioned by their start time.
            const itemTime = (
                item: Message | SelfieRequest | VoiceCallWithMessages,
            ) =>
                "sent" in item
                    ? item.sent
                    : "completed" in item
                      ? item.completed
                      : item.started;
            const all = [...items, ...voiceCalls].sort(
                (a, b) =>
                    new Date(itemTime(a)).getTime() -
                    new Date(itemTime(b)).getTime(),
            );

            if (all.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: `No messages found for Nomi with ID ${nomiId}`,
                });
            }
            // The page straddling the cutoff still carries older items.
            const fresh = incremental
                ? filterNewerThan(all, itemTime, lastTs)
                : all;

            if (incremental && fresh.length === 0) {
                update("No new messages since your last download.");
                return "No new messages since your last download.";
            }

            // An explicit From→To range wins; otherwise fall back to last-N.
            const messages = applyMessageRange(
                fresh,
                rangeStart,
                rangeEnd,
                maxMessages,
            );

            // Voice audio: map the exported voice messages to their in-zip
            // audio paths so the HTML's players and the saved files agree.
            const rangedFeedItems = messages.filter(
                (item): item is Message | SelfieRequest =>
                    "sent" in item || "completed" in item,
            );
            const voiceMap = includeVoiceAudio
                ? voiceAudioPathMap(rangedFeedItems, voiceAudioRecentLimit)
                : new Map<string, string>();
            // Separated mode with audio: package chat + voice/ into one zip.
            // Honors the user's per-zip size cap; overflow rolls into _PartN.
            const zipMaxBytes =
                maxZipSizeMB > 0
                    ? maxZipSizeMB * 1024 * 1024
                    : CHAT_ZIP_MAX_BYTES;
            const zipSink =
                !emit && includeVoiceAudio && voiceMap.size > 0
                    ? new BundleSink(this.offscreen, zipMaxBytes)
                    : undefined;

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

                    if ("sent" in element) {
                        const message = element as Message;
                        const isNomi =
                            message.type === "Nomi" ||
                            message.type === "NomiStarter";
                        items.push({
                            kind: "message",
                            isNomi,
                            // The API returns null text for some messages
                            // (voice messages, selfie-only turns) despite the
                            // type; coalesce so the chat render can't crash.
                            text: message.text ?? "",
                            sent: message.sent,
                            isVoice: message.isVoiceMessage || undefined,
                            audioSrc: voiceMap.get(message.uuid),
                        });
                    } else if ("completed" in element) {
                        if (includeSelfies) {
                            const request = element as SelfieRequest;
                            items.push(...(await this.fetchSelfies(request)));
                        }
                    } else {
                        const call = element as VoiceCallWithMessages;
                        items.push({
                            kind: "voiceCall",
                            started: call.started,
                            ended: call.ended ?? undefined,
                            messages: call.messages.map((m) => ({
                                isNomi: m.type !== "User",
                                text: m.text ?? "",
                                created: m.created,
                            })),
                        });
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

                if (emit || zipSink) {
                    // Bundle / chat-zip mode: simple in-zip names.
                    const name =
                        chunks.length > 1
                            ? `chat_part${j + 1}.html`
                            : "chat.html";
                    if (emit) await emit(name, chatHtml);
                    else await zipSink?.addText(name, chatHtml);
                    currentMessageIndex += chunk.length;
                    continue;
                }

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

            // Fetch the voice audio files next to the chat HTML.
            const put = audioSink ?? zipSink;
            if (includeVoiceAudio && voiceMap.size > 0 && put) {
                await fetchVoiceAudio({
                    nomiId,
                    items: rangedFeedItems,
                    put: (path, base64) => put.addFile(path, base64),
                    offscreen: this.offscreen,
                    onProgress: update,
                    recentLimit: voiceAudioRecentLimit,
                });
            }

            // Chat-zip mode: package and save the zip part(s).
            if (zipSink) {
                update("Packaging chat zip…");
                const nomiNameSafe = nomi.name.replace(/ /g, "-");
                const downloads = await zipSink.finalize(
                    `${nomiNameSafe}_Chat(${messages.length})_${stringDate}`,
                );
                for (const download of downloads) {
                    const res = await this.offscreen.download(
                        download.url,
                        download.filename,
                        { isBlob: true },
                        update,
                    );
                    if (res.note) saveNote = res.note;
                    await new Promise((resolve) =>
                        setTimeout(resolve, DOWNLOAD_THROTTLE_MS),
                    );
                }
            }

            // Caught up: remember the newest item we just downloaded.
            if (incremental && messages.length > 0) {
                const newest = newestTimestamp(messages, itemTime);
                if (newest) await setLastTimestamp("chat", nomiId, newest);
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
            // Rethrow so the caller reports failure instead of "Chat
            // downloaded!"; swallowing it here made a crashed export (e.g. a
            // null-text message) look like a successful save with no file.
            // The bundle path wraps this call in its own try/catch, so an
            // "everything" download still finishes its other sections.
            throw error;
        }
    }

    private estimateItemSize(
        item: Message | SelfieRequest | VoiceCallWithMessages,
        includeSelfies?: boolean,
    ): number {
        if ("sent" in item) return MESSAGE_BYTES;
        if ("completed" in item) {
            return includeSelfies ? item.selfies.length * SELFIE_BYTES : 0;
        }
        return Math.max(1, item.messages.length) * MESSAGE_BYTES;
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
