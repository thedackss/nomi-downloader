import { NomiApiClient } from "../../nomi/api";
import { api } from "../../nomi/http";
import type { DownloadAlbumProps } from "../../nomi/interfaces/downloadAlbum";
import type { DownloadChatProps } from "../../nomi/interfaces/downloadChat";
import type { NomiExistsProps } from "../../nomi/interfaces/exists";
import { getNomiImageUrl } from "../../nomi/media";
import type { ApiNomisIdResponse } from "../../nomi/types/api.nomis.id";
import { Log } from "../../utils/log";
import { AlbumDownloader } from "./albumDownloader";
import { ChatDownloader } from "./chatDownloader";
import { buildMindMapPayload } from "./mindmap/builder";
import { OffscreenClient } from "./offscreenClient";

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
     * Build the standalone mind map HTML for a Nomi. Returns null when the Nomi
     * has no mind map yet. Renders in the offscreen document so react-dom/server
     * never loads in the service worker.
     */
    async renderMindMap({ nomiId }: NomiExistsProps): Promise<string | null> {
        const data = await this.api.getMindInfo({ nomiId });
        if (!data) return null;

        await this.offscreen.setupDocument();

        const nomi = await this.api.get({ nomiId });
        const avatar = await this.fetchAvatar(nomi);

        const payload = buildMindMapPayload(
            nomi.name,
            data,
            new Date().toISOString(),
            avatar,
        );
        return this.offscreen.renderMindMap(payload);
    }

    /** Fetch a Nomi's avatar as a data URI; undefined if it can't be fetched. */
    private async fetchAvatar(
        nomi: ApiNomisIdResponse,
    ): Promise<string | undefined> {
        try {
            const { data } = await api.get(getNomiImageUrl(nomi), {
                responseType: "blob",
            });
            const base64 = await this.offscreen.blobToBase64(data);
            return `data:image/webp;base64,${base64}`;
        } catch (err) {
            Log("Failed to fetch Nomi avatar for mind map", err);
            return undefined;
        }
    }

    downloadAlbum(props: DownloadAlbumProps) {
        return new AlbumDownloader(this.api, this.offscreen).run(props);
    }

    downloadChat(props: DownloadChatProps) {
        return new ChatDownloader(this.api, this.offscreen).run(props);
    }
}
