import { NomiApiClient, type NomiChatFeed } from "../../nomi/api";
import { api } from "../../nomi/http";
import type { DownloadAlbumProps } from "../../nomi/interfaces/downloadAlbum";
import type { DownloadBundleProps } from "../../nomi/interfaces/downloadBundle";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type {
    DownloadGroupChatProps,
    GroupExportProps,
} from "../../nomi/interfaces/downloadGroupChat";
import type {
    ChatMarkdownProps,
    NomiExistsProps,
} from "../../nomi/interfaces/exists";
import type { ApiAnchorLooksResponse } from "../../nomi/types/api.nomis.id.anchorLooks";
import { Log } from "../../utils/log";
import { AlbumDownloader, type AlbumMediaMeta } from "./albumDownloader";
import { buildBundleIndexHtml } from "./bundle/indexHtml";
import { BundleSink } from "./bundle/sink";
import { callAnchor } from "./chat/types";
import { ChatDownloader } from "./chatDownloader";
import { ALBUM_CHUNK_MAX_BYTES, DOWNLOAD_THROTTLE_MS } from "./constants";
import { fileStamp } from "./fileStamp";
import { GroupChatDownloader } from "./groupChatDownloader";
import { fetchHeaderMedia } from "./headerMedia";
import {
    filterNewerThan,
    getLastTimestamp,
    newestTimestamp,
    setLastTimestamp,
} from "./incrementalStore";
import { buildNomiJson, type NomiJsonInput } from "./json/builder";
import { buildGroupJson } from "./json/groupBuilder";
import { buildChatMarkdown, buildNomiMarkdown } from "./markdown/builder";
import { buildGroupMarkdown } from "./markdown/groupBuilder";
import { applyMessageRange } from "./messageRange";
import { buildMindMapPayload } from "./mindmap/builder";
import { OffscreenClient } from "./offscreenClient";
import {
    buildAnchorRefs,
    buildImageNotes,
    buildSharedNotes,
} from "./sharednotes/builder";
import type { AnchorLook, SharedNotesRenderPayload } from "./sharednotes/types";

/** Status callback surfaced in the popup while a download runs. */
type ProgressFn = (message: string) => void;

/**
 * Facade over the Nomi data API, offscreen/zip bridge, and the album/chat
 * download workflows. Keeps a single entry point for the background worker.
 */
export class Nomi {
    private readonly api = new NomiApiClient();
    private readonly offscreen = new OffscreenClient();

    /** Embed the profile video in HTML export headers (set per request). */
    private embedHeaderVideo = false;

    setEmbedHeaderVideo(value: boolean) {
        this.embedHeaderVideo = value;
    }

    get(props: NomiExistsProps) {
        return this.api.get(props);
    }

    getMindInfo(props: NomiExistsProps) {
        return this.api.getMindInfo(props);
    }

    /**
     * Build and save a Nomi's mind map as a standalone HTML file. Returns false
     * when the Nomi has no mind map yet. Renders in the offscreen document so
     * react-dom/server never loads in the service worker, and saves via an
     * offscreen Blob URL (the rendered HTML inlines CSS + the avatar and is too
     * big for a reliable data: URL).
     */
    async downloadMindMap({
        nomiId,
        onProgress,
    }: NomiExistsProps & { onProgress?: ProgressFn }): Promise<boolean> {
        const rendered = await this.renderMindMapHtml(nomiId, onProgress);
        if (!rendered) return false;

        const { url, isBlob } = await this.toDownloadUrl(rendered.html);
        const nameSafe = rendered.name.replace(/ /g, "-");
        const stamp = fileStamp();

        await this.offscreen.download(
            url,
            `${nameSafe}_MindMap_${stamp}.html`,
            {
                isBlob,
                saveAs: true,
            },
        );

        return true;
    }

    /** Render the mind map HTML, or null when the Nomi has none yet. */
    private async renderMindMapHtml(
        nomiId: number,
        onProgress?: ProgressFn,
        prefetchedMind?: NomiJsonInput["mind"],
    ): Promise<{ html: string; name: string } | null> {
        const data =
            prefetchedMind !== undefined
                ? prefetchedMind
                : await this.api.getMindInfo({ nomiId, onProgress });
        if (!data) return null;

        await this.offscreen.setupDocument();

        const nomi = await this.api.get({ nomiId });
        const { avatar, avatarVideo } = await fetchHeaderMedia(
            nomi,
            this.offscreen,
            this.embedHeaderVideo,
        );

        const payload = {
            ...buildMindMapPayload(
                nomi.name,
                data,
                new Date().toISOString(),
                avatar,
                avatarVideo,
            ),
            nomiId: nomi.id,
        };
        const html = await this.offscreen.renderMindMap(payload);
        return { html, name: nomi.name };
    }

    /**
     * Build and save a Nomi's Shared Notes as a standalone HTML file. Returns
     * false when the Nomi has no filled-in notes. Renders in the offscreen
     * document and saves via a Blob URL, like downloadMindMap.
     */
    async downloadSharedNotes({ nomiId }: NomiExistsProps): Promise<boolean> {
        const rendered = await this.renderSharedNotesHtml(nomiId);
        if (!rendered) return false;

        const { url, isBlob } = await this.toDownloadUrl(rendered.html);
        const nameSafe = rendered.name.replace(/ /g, "-");
        const stamp = fileStamp();

        await this.offscreen.download(
            url,
            `${nameSafe}_SharedNotes_${stamp}.html`,
            { isBlob, saveAs: true },
        );

        return true;
    }

    /** Render the shared notes HTML, or null when there is nothing to show. */
    private async renderSharedNotesHtml(
        nomiId: number,
    ): Promise<{ html: string; name: string } | null> {
        const data = await this.api.getSharedNotes({ nomiId });
        if (!data) return null;

        const nomi = await this.api.get({ nomiId });
        const notes = buildSharedNotes(nomi.name, data);
        const imageNotes = buildImageNotes(nomi.name, data);

        await this.offscreen.setupDocument();

        const looks = await this.api.getAnchorLooks({ nomiId });
        const anchors = await this.fetchAnchors(nomiId, looks);

        if (
            notes.length === 0 &&
            imageNotes.length === 0 &&
            anchors.length === 0
        ) {
            return null;
        }

        const { avatar, avatarVideo } = await fetchHeaderMedia(
            nomi,
            this.offscreen,
            this.embedHeaderVideo,
        );
        const payload: SharedNotesRenderPayload = {
            name: nomi.name,
            nomiId: nomi.id,
            avatar,
            avatarVideo,
            generatedAt: new Date().toISOString(),
            notes,
            anchors,
            imageNotes,
        };
        const html = await this.offscreen.renderSharedNotes(payload);
        return { html, name: nomi.name };
    }

    /**
     * Build and save a Nomi's full data as a structured JSON file: shared
     * notes, image settings, mind map and chat. With `rawData`, the untouched
     * API responses are attached too. Saved via a Blob URL (can be large).
     */
    async downloadJson(
        { nomiId, onProgress }: NomiExistsProps & { onProgress?: ProgressFn },
        rawData = false,
    ): Promise<void> {
        const input = await this.gatherNomiData(
            nomiId,
            undefined,
            undefined,
            onProgress,
        );
        const json = buildNomiJson(input, rawData);
        await this.saveExport(
            input.nomi.name,
            JSON.stringify(json, null, 2),
            "application/json",
            "json",
        );
    }

    /**
     * Build and save a Nomi's full data as a Markdown document (the same data
     * as the JSON export, without raw responses).
     */
    async downloadMarkdown({
        nomiId,
        onProgress,
    }: NomiExistsProps & { onProgress?: ProgressFn }): Promise<void> {
        const input = await this.gatherNomiData(
            nomiId,
            undefined,
            undefined,
            onProgress,
        );
        const markdown = buildNomiMarkdown(input);
        await this.saveExport(input.nomi.name, markdown, "text/markdown", "md");
    }

    /**
     * Build and save a focused Markdown document with only the chat log and
     * the backstory (Shared Notes). Honors the chat "Max messages" / "Message
     * range" settings, and the "Only new since last" (incremental) toggle —
     * tracked independently of the HTML chat export. The backstory is always
     * included in full; only the chat log is trimmed. Returns a closing message
     * when incremental finds nothing new.
     */
    async downloadChatMarkdown({
        nomiId,
        maxMessages = 0,
        rangeStart = 0,
        rangeEnd = 0,
        incremental = false,
        onProgress,
    }: ChatMarkdownProps): Promise<string | undefined> {
        // Resolve the cutoff first so the fetch itself can stop early instead
        // of paging through the whole history just to discard it below.
        const lastTs = incremental
            ? await getLastTimestamp("chatMarkdown", nomiId)
            : undefined;
        const input = await this.gatherNomiData(
            nomiId,
            undefined,
            lastTs,
            onProgress,
        );

        const itemTime = (item: NomiJsonInput["messages"][number]) =>
            "sent" in item ? item.sent : item.completed;

        // Incremental: keep only messages newer than the last chat-Markdown run
        // (the page straddling the cutoff still carries older ones).
        const fresh = incremental
            ? filterNewerThan(input.messages, itemTime, lastTs)
            : input.messages;
        if (incremental && fresh.length === 0) {
            Log(`Incremental: nothing newer than ${lastTs} — no file written.`);
            return "No new messages since your last download.";
        }

        // Explicit From→To range wins; otherwise fall back to last-N.
        const messages = applyMessageRange(
            fresh,
            rangeStart,
            rangeEnd,
            maxMessages,
        );
        const markdown = buildChatMarkdown({ ...input, messages });
        await this.saveExport(
            `${input.nomi.name}_Chat`,
            markdown,
            "text/markdown",
            "md",
        );

        // Caught up: remember the newest message we just exported.
        if (incremental && messages.length > 0) {
            const newest = newestTimestamp(messages, itemTime);
            if (newest) await setLastTimestamp("chatMarkdown", nomiId, newest);
        }
    }

    /**
     * Fetch every dataset the full export needs (chat is best-effort).
     * `since` limits the chat fetch to pages reaching that timestamp, for
     * incremental exports.
     */
    private async gatherNomiData(
        nomiId: number,
        prefetchedChat?: NomiChatFeed,
        since?: string,
        onProgress?: ProgressFn,
        prefetchedMind?: NomiJsonInput["mind"],
    ): Promise<NomiJsonInput> {
        const [nomi, shared, anchors, mind] = await Promise.all([
            this.api.get({ nomiId }),
            this.api.getSharedNotes({ nomiId }),
            this.api.getAnchorLooks({ nomiId }),
            // A failed mind map fetch shouldn't sink the whole export; the
            // rest of the data is still worth having.
            prefetchedMind !== undefined
                ? Promise.resolve(prefetchedMind)
                : this.api.getMindInfo({ nomiId, onProgress }).catch((err) => {
                      Log("Mind map fetch failed for export", err);
                      return null;
                  }),
        ]);

        // Chat failures propagate: a mostly-empty "full export" that looks
        // complete is worse than an honest error.
        const chatData =
            prefetchedChat ??
            (await this.api.getMessages({
                nomiId,
                since,
                onProgress: (found) =>
                    onProgress?.(`Scanning messages: ${found} found`),
            }));

        return {
            nomiId,
            nomi,
            shared,
            anchors,
            mind,
            messages: chatData.items,
            voiceCalls: chatData.voiceCalls,
        };
    }

    /**
     * The simple-mode single button: everything about a Nomi packed into one
     * zip — an index.html hub, the chat, shared notes, mind map and JSON,
     * plus the album under album/. Every section is best-effort; the hub only
     * links what actually made it in. Oversized albums roll into _PartN zips
     * that extract into the same tree.
     */
    async downloadBundle(
        props: DownloadBundleProps,
    ): Promise<string | undefined> {
        const { nomiId, onProgress } = props;
        const update = (message: string) => onProgress?.(message);

        await this.offscreen.setupDocument();
        const nomi = await this.api.get({ nomiId });
        const nameSafe = (nomi.name || `Nomi_${nomiId}`).replace(/ /g, "-");
        const dateStr = fileStamp();
        const baseName = `Nomi_${nameSafe}_${dateStr}`;

        const maxBytes =
            props.maxZipSizeMB && props.maxZipSizeMB > 0
                ? props.maxZipSizeMB * 1024 * 1024
                : ALBUM_CHUNK_MAX_BYTES;
        const sink = new BundleSink(this.offscreen, maxBytes);

        // One messages fetch feeds both the chat HTML and the JSON export.
        let chatData: NomiChatFeed | undefined;
        try {
            chatData = await this.api.getMessages({
                nomiId,
                onProgress: (found) =>
                    update(`Scanning messages: ${found} found`),
            });
        } catch (err) {
            Log("Bundle: fetching messages failed", err);
        }

        const chatParts: string[] = [];
        if (
            chatData &&
            (chatData.items.length > 0 || chatData.voiceCalls.length > 0)
        ) {
            try {
                await new ChatDownloader(
                    this.api,
                    this.offscreen,
                    this.embedHeaderVideo,
                ).run({
                    nomiId,
                    includeSelfies: props.includeSelfies ?? true,
                    maxMessages: props.maxMessages,
                    rangeStart: props.rangeStart,
                    rangeEnd: props.rangeEnd,
                    messagesPerFile: props.messagesPerFile,
                    maxFileSizeMB: props.maxFileSizeMB,
                    includeVoiceAudio: props.includeVoiceAudio,
                    voiceAudioRecentLimit: props.voiceAudioRecentLimit,
                    onProgress,
                    prefetched: chatData,
                    // Prefix the doc files with the Nomi name so they are
                    // recognizable once extracted (Sarah_chat.html …).
                    emit: async (filename, html) => {
                        const named = `${nameSafe}_${filename}`;
                        await sink.addText(named, html);
                        chatParts.push(named);
                    },
                    audioSink: {
                        addFile: (path, base64) => sink.addFile(path, base64),
                    },
                });
            } catch (err) {
                Log("Bundle: chat section failed", err);
            }
        }
        // Messages (not selfies) drive the chat card's count.
        const messageCount = (chatData?.items ?? []).filter(
            (i) => "sent" in i,
        ).length;

        update("Rendering shared notes…");
        let sharedNotesFile: string | undefined;
        try {
            const rendered = await this.renderSharedNotesHtml(nomiId);
            if (rendered) {
                sharedNotesFile = `${nameSafe}_shared-notes.html`;
                await sink.addText(sharedNotesFile, rendered.html);
            }
        } catch (err) {
            Log("Bundle: shared notes section failed", err);
        }

        update("Rendering mind map…");
        let mindMapFile: string | undefined;
        // Fetched once and reused for both the mind map and data.json — a
        // big mind map is by far the most expensive dataset here.
        let mindData: NomiJsonInput["mind"] = null;
        try {
            mindData = await this.api.getMindInfo({
                nomiId,
                onProgress: update,
            });
        } catch (err) {
            Log("Bundle: mind map fetch failed", err);
        }
        try {
            const rendered = await this.renderMindMapHtml(
                nomiId,
                update,
                mindData,
            );
            if (rendered) {
                mindMapFile = `${nameSafe}_mind-map.html`;
                await sink.addText(mindMapFile, rendered.html);
            }
        } catch (err) {
            Log("Bundle: mind map section failed", err);
        }
        const termCount = (mindData?.terms ?? []).reduce(
            (n, t) => n + t.items.length,
            0,
        );

        update("Building data.json…");
        let dataFile: string | undefined;
        try {
            const input = await this.gatherNomiData(
                nomiId,
                chatData,
                undefined,
                update,
                mindData,
            );
            dataFile = `${nameSafe}_data.json`;
            await sink.addText(
                dataFile,
                JSON.stringify(buildNomiJson(input, false), null, 2),
            );
        } catch (err) {
            Log("Bundle: JSON section failed", err);
        }

        // Collected as the album streams, so the index can group by type and
        // caption each image with its prompt (paths get the `album/` prefix).
        const albumMedia: AlbumMediaMeta[] = [];
        try {
            await new AlbumDownloader(this.api, this.offscreen).run({
                nomiId,
                onProgress,
                quality: props.quality,
                folderization: props.folderization,
                downloadQuantity: props.downloadQuantity,
                prompts: props.prompts,
                recentLimit: props.recentLimit,
                startIndex: props.startIndex,
                sink: {
                    addFile: (path, base64) =>
                        sink.addFile(`album/${path}`, base64),
                },
                onMedia: (m) =>
                    albumMedia.push({ ...m, path: `album/${m.path}` }),
            });
        } catch (err) {
            Log("Bundle: album section failed", err);
        }

        // The hub goes last (it needs the final file list) but is pinned
        // into the first part, next to the docs.
        const paths = sink.entries().map((e) => e.path);
        const voiceFiles = paths.filter((p) => p.startsWith("voice/"));
        const calls = (chatData?.voiceCalls ?? []).map((c) => ({
            started: c.started,
            ended: c.ended ?? undefined,
            anchor: callAnchor(c.started),
        }));
        await sink.addText(
            "index.html",
            buildBundleIndexHtml({
                name: nomi.name,
                nomiId,
                generatedAt: new Date().toISOString(),
                chatParts,
                messageCount,
                sharedNotesFile,
                mindMap: mindMapFile
                    ? { file: mindMapFile, termCount }
                    : undefined,
                dataFile,
                album: albumMedia,
                voiceFiles,
                calls,
            }),
            true,
        );

        update("Packaging bundle…");
        const downloads = await sink.finalize(baseName);
        if (downloads.length === 0) {
            update("Nothing to package.");
            return "Nothing to package.";
        }

        let note: string | undefined;
        for (const download of downloads) {
            const res = await this.offscreen.download(
                download.url,
                download.filename,
                { isBlob: true },
                update,
            );
            if (res.note) note = res.note;
            await new Promise((resolve) =>
                setTimeout(resolve, DOWNLOAD_THROTTLE_MS),
            );
        }

        return note;
    }

    /** Save export text via a Blob URL (exports can be large). */
    private async saveExport(
        nomiName: string,
        content: string,
        type: string,
        extension: string,
    ): Promise<void> {
        await this.offscreen.setupDocument();
        const { url, isBlob } = await this.toDownloadUrl(content, type);
        const nameSafe = nomiName.replace(/ /g, "-");
        const stamp = fileStamp();

        await this.offscreen.download(
            url,
            `${nameSafe}_Data_${stamp}.${extension}`,
            { isBlob, saveAs: true },
        );
    }

    /**
     * Turn rendered content into a download URL. Prefers an offscreen Blob URL
     * (safe for large strings); falls back to a base64 data URI when offscreen
     * is unavailable (tests / Firefox page).
     */
    private async toDownloadUrl(
        content: string,
        type = "text/html",
    ): Promise<{ url: string; isBlob: boolean }> {
        try {
            const res = await this.offscreen.call("create-blob-url", {
                content,
                type,
            });
            if (res?.success && res.url) {
                return { url: res.url, isBlob: true };
            }
        } catch {
            // fall through to data URI
        }

        const base64 = btoa(unescape(encodeURIComponent(content)));
        return { url: `data:${type};base64,${base64}`, isBlob: false };
    }

    /** Fetch an image URL as a webp data URI; undefined if it can't be fetched. */
    private async fetchImageDataUri(url: string): Promise<string | undefined> {
        try {
            const { data } = await api.get(url, { responseType: "blob" });
            const base64 = await this.offscreen.blobToBase64(data);
            return `data:image/webp;base64,${base64}`;
        } catch (err) {
            Log("Failed to fetch image", url, err);
            return undefined;
        }
    }

    /** Resolve anchor looks into renderable items with embedded preview images. */
    private async fetchAnchors(
        nomiId: number,
        looks: ApiAnchorLooksResponse | null,
    ): Promise<AnchorLook[]> {
        if (!looks) return [];
        const refs = buildAnchorRefs(nomiId, looks);
        return Promise.all(
            refs.map(async (ref) => ({
                fidelity: ref.fidelity,
                anchorType: ref.anchorType,
                style: ref.style,
                appearanceTraits: ref.appearanceTraits,
                additionalTraits: ref.additionalTraits,
                stickyAesthetic: ref.stickyAesthetic,
                image: ref.imageUrl
                    ? await this.fetchImageDataUri(ref.imageUrl)
                    : undefined,
            })),
        );
    }

    downloadAlbum(props: DownloadAlbumProps) {
        return new AlbumDownloader(this.api, this.offscreen).run(props);
    }

    downloadChat(props: DownloadChatProps) {
        return new ChatDownloader(
            this.api,
            this.offscreen,
            this.embedHeaderVideo,
        ).run(props);
    }

    downloadGroupChat(props: DownloadGroupChatProps) {
        return new GroupChatDownloader(this.api, this.offscreen).run(props);
    }

    /** Save a group's data (facts + chat log) as structured JSON. */
    async downloadGroupJson(
        { groupId, name, info }: GroupExportProps,
        rawData = false,
    ): Promise<void> {
        const messages = await this.api.getGroupMessages({ groupId });
        const json = buildGroupJson({ groupId, name, info, messages }, rawData);
        await this.saveExport(
            name,
            JSON.stringify(json, null, 2),
            "application/json",
            "json",
        );
    }

    /** Save a group's data (facts + chat log) as a Markdown document. */
    async downloadGroupMarkdown({
        groupId,
        name,
        info,
    }: GroupExportProps): Promise<void> {
        const messages = await this.api.getGroupMessages({ groupId });
        const markdown = buildGroupMarkdown({ groupId, name, info, messages });
        await this.saveExport(name, markdown, "text/markdown", "md");
    }
}
