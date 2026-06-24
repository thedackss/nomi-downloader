import { NomiApiClient } from "./api";
import { OffscreenClient } from "./offscreenClient";
import { AlbumDownloader } from "./albumDownloader";
import { ChatDownloader } from "./chatDownloader";
import type { NomiExistsProps } from "./interfaces/exists";
import type { DownloadAlbumProps } from "./interfaces/downloadAlbum";
import type { DownloadChatProps } from "./interfaces/downloadChat";

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

    downloadAlbum(props: DownloadAlbumProps) {
        return new AlbumDownloader(this.api, this.offscreen).run(props);
    }

    downloadChat(props: DownloadChatProps) {
        return new ChatDownloader(this.api, this.offscreen).run(props);
    }
}
