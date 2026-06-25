import type { Media } from "../../nomi/types/api.nomis.id.medias";
import { Log } from "../../utils/log";
import { api } from "../../nomi/http";
import type { NomiApiClient } from "../../nomi/api";
import { chunkBySize } from "./chunk";
import {
    ALBUM_CHUNK_MAX_BYTES,
    ALBUM_FINALIZE_DELAY_MS,
    DEFAULT_DOWNLOAD_QUANTITY,
    DEFAULT_MEDIA_BYTES,
    DOWNLOAD_THROTTLE_MS,
    HD_IMAGE_BYTES,
    MEDIA_DOWNLOAD_TIMEOUT_MS,
    SD_IMAGE_BYTES,
    VIDEO_BYTES,
} from "./constants";
import { NomiError } from "../../nomi/errors";
import type { DownloadAlbumProps } from "../../nomi/interfaces/downloadAlbum";
import type { OffscreenClient } from "./offscreenClient";

type MediaType = "Photo" | "Video" | "Art" | "PhotoEdit";

/** Downloads a Nomi's media album as one or more zip files. */
export class AlbumDownloader {
    constructor(
        private readonly nomiApi: NomiApiClient,
        private readonly offscreen: OffscreenClient,
    ) {}

    async run({
        nomiId,
        onProgress,
        quality = "HD",
        folderization = false,
        downloadQuantity = DEFAULT_DOWNLOAD_QUANTITY,
    }: DownloadAlbumProps) {
        const update = (message: string) => onProgress?.(message);

        try {
            await this.offscreen.setupDocument();

            Log(`Downloading album for Nomi ID: ${nomiId}`);
            const ext = quality === "HD" ? "png" : "webp";

            update("Checking if Nomi exists...");

            const nomi = await this.nomiApi.get({ nomiId });
            const nomiName = nomi.name || `Nomi_${nomiId}`;

            const medias = await this.nomiApi.getMedias({ nomiId, onProgress });

            if (medias.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: `No media found for Nomi with ID ${nomiId}`,
                });
            }

            const chunks = chunkBySize(
                medias,
                (media) => this.estimateSize(media, quality),
                ALBUM_CHUNK_MAX_BYTES,
            );
            const downloads: { url: string; filename: string }[] = [];

            for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                const chunk = chunks[chunkIndex];
                const chunkId = `chunk_${chunkIndex}_${Date.now()}`;

                await this.offscreen.call("create-zip", { id: chunkId });

                const chunkMessage =
                    chunks.length < 2
                        ? ""
                        : `Chunk ${chunkIndex + 1}/${chunks.length}, `;
                update(`${chunkMessage}${chunk.length} media items`);

                const chunkOffset = chunks
                    .slice(0, chunkIndex)
                    .reduce((acc, c) => acc + c.length, 0);

                const processMedia = async (media: Media, i: number) => {
                    const { type, url, isMp4 } = await this.resolveMedia(
                        media,
                        ext,
                    );
                    const stringDate = new Date(media.completed)
                        .toISOString()
                        .split("T")[0];
                    const globalIndex = i + chunkOffset;
                    const path = this.buildPath({
                        type,
                        isMp4,
                        ext,
                        nomiId,
                        globalIndex,
                        stringDate,
                        folderization,
                    });

                    update(
                        `${chunkMessage}Downloading media ${globalIndex + 1}/${medias.length}`,
                    );

                    try {
                        const { data } = await api.get(url, {
                            responseType: "blob",
                            timeout: MEDIA_DOWNLOAD_TIMEOUT_MS,
                        });

                        const base64 = await this.offscreen.blobToBase64(data);

                        await this.offscreen.call("add-file", {
                            id: chunkId,
                            path,
                            content: base64,
                        });
                    } catch (error) {
                        update(
                            `${chunkMessage}Error downloading media ${globalIndex + 1}/${medias.length}, skipping`,
                        );
                        Log(
                            `Failed to download media ID ${media.id} from URL ${url}:`,
                            error,
                        );
                    }
                };

                for (let i = 0; i < chunk.length; i += downloadQuantity) {
                    const promises = [];
                    for (let j = 0; j < downloadQuantity; j++) {
                        const index = i + j;
                        if (index < chunk.length) {
                            promises.push(processMedia(chunk[index], index));
                        }
                    }
                    await Promise.all(promises);
                }

                const response = await this.offscreen.call("generate-zip", {
                    id: chunkId,
                });

                if (response.success && response.url) {
                    downloads.push({
                        url: response.url,
                        filename: this.buildFilename({
                            nomiName,
                            count: medias.length,
                            quality,
                            chunkIndex,
                            chunkCount: chunks.length,
                        }),
                    });
                } else {
                    Log(
                        `Failed to generate zip for chunk ${chunkIndex + 1}`,
                        response.error,
                    );
                }

                await this.offscreen.call("clear-zip", { id: chunkId });
                Log(
                    `Chunk ${chunkIndex + 1} processed. Found ${medias.length} items.`,
                );
            }

            for (const download of downloads) {
                try {
                    await chrome.downloads.download({
                        url: download.url,
                        filename: download.filename,
                        saveAs: false,
                    });
                    // Small delay to avoid browser hiccups starting many downloads
                    await new Promise((resolve) =>
                        setTimeout(resolve, DOWNLOAD_THROTTLE_MS),
                    );
                } catch (err) {
                    Log("Download failed", err);
                }
            }

            await new Promise((resolve) =>
                setTimeout(resolve, ALBUM_FINALIZE_DELAY_MS),
            );
        } catch (error) {
            if (error instanceof NomiError) {
                Log(`NomiError: ${error.message}`);
                update(`Error: ${error.message}`);
            } else {
                Log("Unexpected error during album download:", error);
                update("An unexpected error occurred during download.");
            }
        }
    }

    private estimateSize(media: Media, quality: "HD" | "SD"): number {
        const imageSize = quality === "HD" ? HD_IMAGE_BYTES : SD_IMAGE_BYTES;

        if (media.type === "Photo" || media.type === "Art") return imageSize;
        if (media.mediaType === "ImageEditRequest") return imageSize;
        if (media.mediaType === "VideoRequest") return VIDEO_BYTES;
        return DEFAULT_MEDIA_BYTES;
    }

    private resolveType(media: Media): MediaType {
        let type: MediaType = "Photo";

        if (media.type === "Art") type = "Art";
        else if (media.type === "Photo") type = "Photo";

        if (media.mediaType === "VideoRequest") type = "Video";
        else if (media.mediaType === "ImageEditRequest") type = "PhotoEdit";

        return type;
    }

    private async resolveMedia(
        media: Media,
        ext: string,
    ): Promise<{ type: MediaType; url: string; isMp4: boolean }> {
        const type = this.resolveType(media);
        let url = "";
        let isMp4 = false;

        if (type === "Photo" || type === "Art") {
            url = `/selfie-requests/${media.selfieRequestId}/images/${media.id}.${ext}`;
        } else if (type === "Video") {
            const mp4Url = `/video-requests/${media.uuid}.mp4`;
            const webpUrl = `/video-requests/${media.uuid}.webp`;
            try {
                await api.head(mp4Url);
                url = mp4Url;
                isMp4 = true;
            } catch {
                url = webpUrl;
            }
        } else if (type === "PhotoEdit") {
            url = `/image-edit-requests/${media.uuid}/edited-image.${ext}`;
        }

        return { type, url, isMp4 };
    }

    private buildPath({
        type,
        isMp4,
        ext,
        nomiId,
        globalIndex,
        stringDate,
        folderization,
    }: {
        type: MediaType;
        isMp4: boolean;
        ext: string;
        nomiId: number;
        globalIndex: number;
        stringDate: string;
        folderization: boolean;
    }): string {
        let fileExt = ext;
        if (type === "Video") fileExt = isMp4 ? "mp4" : "webp";

        const path = `nomi_${nomiId}_${globalIndex}_${stringDate}.${fileExt}`;
        return folderization ? `${type.toLowerCase()}/${path}` : path;
    }

    private buildFilename({
        nomiName,
        count,
        quality,
        chunkIndex,
        chunkCount,
    }: {
        nomiName: string;
        count: number;
        quality: "HD" | "SD";
        chunkIndex: number;
        chunkCount: number;
    }): string {
        // e.g. Lexi_Album(360)_Thu-Feb-19-2026_(webp).zip
        const dateStr = new Date().toDateString().replace(/ /g, "-");
        const ext = quality === "HD" ? "png" : "webp";
        const partSuffix = chunkCount > 1 ? `_Part${chunkIndex + 1}` : "";
        return `${nomiName}_Album(${count})_${dateStr}_(${ext})${partSuffix}.zip`;
    }
}
