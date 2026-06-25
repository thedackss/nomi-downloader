import { NomiApiClient } from "../../nomi/api";
import { api } from "../../nomi/http";
import type { DownloadAlbumProps } from "../../nomi/interfaces/downloadAlbum";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type { NomiExistsProps } from "../../nomi/interfaces/exists";
import { getNomiImageUrl } from "../../nomi/media";
import type { ApiNomisIdResponse } from "../../nomi/types/api.nomis.id";
import type { ApiAnchorLooksResponse } from "../../nomi/types/api.nomis.id.anchorLooks";
import { Log } from "../../utils/log";
import { AlbumDownloader } from "./albumDownloader";
import { ChatDownloader } from "./chatDownloader";
import { BLOB_URL_REVOKE_DELAY_MS } from "./constants";
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
        const avatar = await this.fetchAvatar(nomi);

        const payload = buildMindMapPayload(
            nomi.name,
            data,
            new Date().toISOString(),
            avatar,
        );
        const html = await this.offscreen.renderMindMap(payload);

        const { url, isBlob } = await this.toDownloadUrl(html);
        const nameSafe = nomi.name.replace(/ /g, "-");
        const stamp = new Date().toISOString().slice(0, 10);

        await chrome.downloads.download({
            url,
            filename: `${nameSafe}_MindMap_${stamp}.html`,
            saveAs: true,
        });

        if (isBlob) {
            // Delay revoke so the download has time to start.
            setTimeout(() => {
                this.offscreen.call("revoke-blob-url", { url });
            }, BLOB_URL_REVOKE_DELAY_MS);
        }

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

        const payload: SharedNotesRenderPayload = {
            name: nomi.name,
            avatar: await this.fetchAvatar(nomi),
            generatedAt: new Date().toISOString(),
            notes,
            anchors,
            imageNotes,
        };
        const html = await this.offscreen.renderSharedNotes(payload);

        const { url, isBlob } = await this.toDownloadUrl(html);
        const nameSafe = nomi.name.replace(/ /g, "-");
        const stamp = new Date().toISOString().slice(0, 10);

        await chrome.downloads.download({
            url,
            filename: `${nameSafe}_SharedNotes_${stamp}.html`,
            saveAs: true,
        });

        if (isBlob) {
            // Delay revoke so the download has time to start.
            setTimeout(() => {
                this.offscreen.call("revoke-blob-url", { url });
            }, BLOB_URL_REVOKE_DELAY_MS);
        }

        return true;
    }

    /**
     * Turn rendered HTML into a download URL. Prefers an offscreen Blob URL
     * (safe for large strings); falls back to a base64 data URI when offscreen
     * is unavailable (tests / Firefox page).
     */
    private async toDownloadUrl(
        html: string,
    ): Promise<{ url: string; isBlob: boolean }> {
        try {
            const res = await this.offscreen.call("create-blob-url", {
                content: html,
                type: "text/html",
            });
            if (res?.success && res.url) {
                return { url: res.url, isBlob: true };
            }
        } catch {
            // fall through to data URI
        }

        const base64 = btoa(unescape(encodeURIComponent(html)));
        return { url: `data:text/html;base64,${base64}`, isBlob: false };
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

    /** Fetch a Nomi's avatar as a data URI; undefined if it can't be fetched. */
    private fetchAvatar(nomi: ApiNomisIdResponse): Promise<string | undefined> {
        return this.fetchImageDataUri(getNomiImageUrl(nomi));
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
                appearanceTraits: ref.appearanceTraits,
                label: ref.label,
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
        return new ChatDownloader(this.api, this.offscreen).run(props);
    }
}
