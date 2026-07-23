import { NomiApiClient, type NomiChatFeed } from "../../nomi/api";
import { api } from "../../nomi/http";
import type { DownloadAlbumProps } from "../../nomi/interfaces/downloadAlbum";
import type { DownloadBundleProps } from "../../nomi/interfaces/downloadBundle";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type {
    DownloadGroupChatProps,
    GroupExportProps,
} from "../../nomi/interfaces/downloadGroupChat";
import type { NomiExistsProps } from "../../nomi/interfaces/exists";
import type { ApiAnchorLooksResponse } from "../../nomi/types/api.nomis.id.anchorLooks";
import { Log } from "../../utils/log";
import { AlbumDownloader } from "./albumDownloader";
import { buildBundleIndexHtml } from "./bundle/indexHtml";
import { BundleSink } from "./bundle/sink";
import { ChatDownloader } from "./chatDownloader";
import { ALBUM_CHUNK_MAX_BYTES, DOWNLOAD_THROTTLE_MS } from "./constants";
import { GroupChatDownloader } from "./groupChatDownloader";
import { fetchHeaderMedia } from "./headerMedia";
import { buildNomiJson, type NomiJsonInput } from "./json/builder";
import { buildGroupJson } from "./json/groupBuilder";
import { buildNomiMarkdown } from "./markdown/builder";
import { buildGroupMarkdown } from "./markdown/groupBuilder";
import { buildMindMapPayload } from "./mindmap/builder";
import { OffscreenClient } from "./offscreenClient";
import {
    buildAnchorRefs,
    buildImageNotes,
    buildSharedNotes,
} from "./sharednotes/builder";
import type { AnchorLook, SharedNotesRenderPayload } from "./sharednotes/types";

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
    async downloadMindMap({ nomiId }: NomiExistsProps): Promise<boolean> {
        const rendered = await this.renderMindMapHtml(nomiId);
        if (!rendered) return false;

        const { url, isBlob } = await this.toDownloadUrl(rendered.html);
        const nameSafe = rendered.name.replace(/ /g, "-");
        const stamp = new Date().toISOString().slice(0, 10);

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
    ): Promise<{ html: string; name: string } | null> {
        const data = await this.api.getMindInfo({ nomiId });
        if (!data) return null;

        await this.offscreen.setupDocument();

        const nomi = await this.api.get({ nomiId });
        const { avatar, avatarVideo } = await fetchHeaderMedia(
            nomi,
            this.offscreen,
            this.embedHeaderVideo,
        );

        const payload = buildMindMapPayload(
            nomi.name,
            data,
            new Date().toISOString(),
            avatar,
            avatarVideo,
        );
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
        const stamp = new Date().toISOString().slice(0, 10);

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
        { nomiId }: NomiExistsProps,
        rawData = false,
    ): Promise<void> {
        const input = await this.gatherNomiData(nomiId);
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
    async downloadMarkdown({ nomiId }: NomiExistsProps): Promise<void> {
        const input = await this.gatherNomiData(nomiId);
        const markdown = buildNomiMarkdown(input);
        await this.saveExport(input.nomi.name, markdown, "text/markdown", "md");
    }

    /** Fetch every dataset the full export needs (chat is best-effort). */
    private async gatherNomiData(
        nomiId: number,
        prefetchedChat?: NomiChatFeed,
    ): Promise<NomiJsonInput> {
        const [nomi, shared, anchors, mind] = await Promise.all([
            this.api.get({ nomiId }),
            this.api.getSharedNotes({ nomiId }),
            this.api.getAnchorLooks({ nomiId }),
            this.api.getMindInfo({ nomiId }),
        ]);

        let messages: NomiChatFeed["items"] = [];
        let voiceCalls: NomiChatFeed["voiceCalls"] = [];
        try {
            const chatData =
                prefetchedChat ?? (await this.api.getMessages({ nomiId }));
            messages = chatData.items;
            voiceCalls = chatData.voiceCalls;
        } catch (err) {
            Log("Failed to fetch messages for export", err);
        }

        return { nomiId, nomi, shared, anchors, mind, messages, voiceCalls };
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
        const dateStr = new Date().toDateString().replace(/ /g, "-");
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
                    onProgress,
                    prefetched: chatData,
                    emit: async (filename, html) => {
                        await sink.addText(filename, html);
                        chatParts.push(filename);
                    },
                    audioSink: {
                        addFile: (path, base64) => sink.addFile(path, base64),
                    },
                });
            } catch (err) {
                Log("Bundle: chat section failed", err);
            }
        }

        update("Rendering shared notes…");
        let hasSharedNotes = false;
        try {
            const rendered = await this.renderSharedNotesHtml(nomiId);
            if (rendered) {
                await sink.addText("shared-notes.html", rendered.html);
                hasSharedNotes = true;
            }
        } catch (err) {
            Log("Bundle: shared notes section failed", err);
        }

        update("Rendering mind map…");
        let hasMindMap = false;
        try {
            const rendered = await this.renderMindMapHtml(nomiId);
            if (rendered) {
                await sink.addText("mind-map.html", rendered.html);
                hasMindMap = true;
            }
        } catch (err) {
            Log("Bundle: mind map section failed", err);
        }

        update("Building data.json…");
        let hasJson = false;
        try {
            const input = await this.gatherNomiData(nomiId, chatData);
            await sink.addText(
                "data.json",
                JSON.stringify(buildNomiJson(input, false), null, 2),
            );
            hasJson = true;
        } catch (err) {
            Log("Bundle: JSON section failed", err);
        }

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
            });
        } catch (err) {
            Log("Bundle: album section failed", err);
        }

        // The hub goes last (it needs the final file list) but is pinned
        // into the first part, next to the docs.
        const paths = sink.entries().map((e) => e.path);
        const voiceFiles = paths.filter((p) => p.startsWith("voice/"));
        const galleryImages = paths.filter(
            (p) =>
                p.startsWith("album/") &&
                /\.(png|webp|jpg)$/i.test(p) &&
                !/(^|\/)video\//.test(p),
        );
        const videos = paths.filter(
            (p) => p.startsWith("album/") && p.endsWith(".mp4"),
        );
        await sink.addText(
            "index.html",
            buildBundleIndexHtml({
                name: nomi.name,
                generatedAt: new Date().toISOString(),
                chatParts,
                hasSharedNotes,
                hasMindMap,
                hasJson,
                galleryImages,
                videos,
                voiceFiles,
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
        const stamp = new Date().toISOString().slice(0, 10);

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
