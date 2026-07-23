import { NomiApiClient } from "../../nomi/api";
import { api } from "../../nomi/http";
import type { DownloadAlbumProps } from "../../nomi/interfaces/downloadAlbum";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type {
    DownloadGroupChatProps,
    GroupExportProps,
} from "../../nomi/interfaces/downloadGroupChat";
import type { NomiExistsProps } from "../../nomi/interfaces/exists";
import type { ApiAnchorLooksResponse } from "../../nomi/types/api.nomis.id.anchorLooks";
import { Log } from "../../utils/log";
import { AlbumDownloader } from "./albumDownloader";
import { ChatDownloader } from "./chatDownloader";
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
        const data = await this.api.getMindInfo({ nomiId });
        if (!data) return false;

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

        const { url, isBlob } = await this.toDownloadUrl(html);
        const nameSafe = nomi.name.replace(/ /g, "-");
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

    /**
     * Build and save a Nomi's Shared Notes as a standalone HTML file. Returns
     * false when the Nomi has no filled-in notes. Renders in the offscreen
     * document and saves via a Blob URL, like downloadMindMap.
     */
    async downloadSharedNotes({ nomiId }: NomiExistsProps): Promise<boolean> {
        const data = await this.api.getSharedNotes({ nomiId });
        if (!data) return false;

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
            return false;
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

        const { url, isBlob } = await this.toDownloadUrl(html);
        const nameSafe = nomi.name.replace(/ /g, "-");
        const stamp = new Date().toISOString().slice(0, 10);

        await this.offscreen.download(
            url,
            `${nameSafe}_SharedNotes_${stamp}.html`,
            { isBlob, saveAs: true },
        );

        return true;
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
    private async gatherNomiData(nomiId: number): Promise<NomiJsonInput> {
        const [nomi, shared, anchors, mind] = await Promise.all([
            this.api.get({ nomiId }),
            this.api.getSharedNotes({ nomiId }),
            this.api.getAnchorLooks({ nomiId }),
            this.api.getMindInfo({ nomiId }),
        ]);

        type ChatData = Awaited<ReturnType<NomiApiClient["getMessages"]>>;
        let messages: ChatData["items"] = [];
        let voiceCalls: ChatData["voiceCalls"] = [];
        try {
            const chatData = await this.api.getMessages({ nomiId });
            messages = chatData.items;
            voiceCalls = chatData.voiceCalls;
        } catch (err) {
            Log("Failed to fetch messages for export", err);
        }

        return { nomiId, nomi, shared, anchors, mind, messages, voiceCalls };
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
