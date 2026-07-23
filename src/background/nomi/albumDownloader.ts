import type { NomiApiClient } from "../../nomi/api";
import { NomiError } from "../../nomi/errors";
import { api } from "../../nomi/http";
import type { DownloadAlbumProps } from "../../nomi/interfaces/downloadAlbum";
import type { Media } from "../../nomi/types/api.nomis.id.medias";
import { Log } from "../../utils/log";
import type { BundleFileSink } from "./bundle/sink";
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
import {
    filterNewerThan,
    getLastTimestamp,
    newestTimestamp,
    setLastTimestamp,
} from "./incrementalStore";
import { bytesToBase64, embedPrompt, textToBase64 } from "./metadata";
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
        imagesPerZip = 0,
        maxZipSizeMB = 0,
        prompts = "off",
        recentLimit = 0,
        startIndex = 0,
        incremental = false,
        sink,
    }: DownloadAlbumProps & {
        /**
         * Bundle mode: stream files into this sink (which owns zip assembly
         * and size rollover) instead of building and downloading zips here.
         */
        sink?: BundleFileSink;
    }) {
        const update = (message: string) => onProgress?.(message);

        try {
            await this.offscreen.setupDocument();

            Log(`Downloading album for Nomi ID: ${nomiId}`);
            const ext = quality === "HD" ? "png" : "webp";

            update("Checking if Nomi exists...");

            const nomi = await this.nomiApi.get({ nomiId });
            const nomiName = nomi.name || `Nomi_${nomiId}`;

            const allMedias = await this.nomiApi.getMedias({
                nomiId,
                onProgress,
            });

            if (allMedias.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: `No media found for Nomi with ID ${nomiId}`,
                });
            }

            // BETA: keep only photos newer than the last successful download.
            const lastTs = incremental
                ? await getLastTimestamp("album", nomiId)
                : undefined;
            const freshMedias = incremental
                ? filterNewerThan(allMedias, (m) => String(m.completed), lastTs)
                : allMedias;

            if (incremental && freshMedias.length === 0) {
                update("No new photos since your last download.");
                return "No new photos since your last download.";
            }

            // Apply the optional range over the chronological (oldest→newest)
            // list: skip to photo #startIndex, then keep the most recent N.
            const medias = this.applyRange(
                freshMedias,
                startIndex,
                recentLimit,
            );

            if (medias.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: `No media in the selected range for Nomi with ID ${nomiId}`,
                });
            }

            // The byte budget is always enforced; an optional user-set
            // "images per zip" (0 = auto) caps the count on top of it.
            const maxCount =
                imagesPerZip > 0 ? imagesPerZip : Number.POSITIVE_INFINITY;
            // User-configurable per-zip size cap (MB); falls back to the default.
            const maxBytes =
                maxZipSizeMB > 0
                    ? maxZipSizeMB * 1024 * 1024
                    : ALBUM_CHUNK_MAX_BYTES;
            // Bundle mode: the sink owns zip assembly and size rollover, so
            // the whole album streams through as a single pass.
            const chunks = sink
                ? [medias]
                : chunkBySize(
                      medias,
                      (media) => this.estimateSize(media, quality),
                      maxBytes,
                      maxCount,
                  );
            const downloads: { url: string; filename: string }[] = [];

            for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                const chunk = chunks[chunkIndex];
                const chunkId = `chunk_${chunkIndex}_${Date.now()}`;

                if (!sink) {
                    await this.offscreen.call("create-zip", { id: chunkId });
                }

                const put = (path: string, content: string) =>
                    sink
                        ? sink.addFile(path, content)
                        : this.offscreen.call("add-file", {
                              id: chunkId,
                              path,
                              content,
                          });

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

                    const label = this.mediaLabel(type);
                    update(
                        `${chunkMessage}Downloading ${label} ${globalIndex + 1}/${medias.length}…`,
                    );

                    try {
                        const { data } = await api.get(url, {
                            responseType: "blob",
                            timeout: MEDIA_DOWNLOAD_TIMEOUT_MS,
                        });

                        const promptText =
                            prompts === "off"
                                ? null
                                : this.extractPrompt(media, type);

                        const wantEmbed =
                            !!promptText &&
                            (prompts === "embed" || prompts === "both");

                        let base64: string | undefined;
                        let embedded = false;

                        if (wantEmbed) {
                            const fileExt = path.split(".").pop() ?? "";
                            const raw = new Uint8Array(
                                await data.arrayBuffer(),
                            );
                            const out = embedPrompt(raw, fileExt, promptText);
                            if (out) {
                                base64 = bytesToBase64(out);
                                embedded = true;
                            }
                        }

                        if (base64 === undefined) {
                            base64 = await this.offscreen.blobToBase64(data);
                        }

                        await put(path, base64);

                        // Write a sidecar when asked for one, or as the fallback
                        // when embedding wasn't possible for this format.
                        const wantSidecar =
                            !!promptText &&
                            (prompts === "sidecar" ||
                                prompts === "both" ||
                                (wantEmbed && !embedded));

                        if (promptText && wantSidecar) {
                            await put(
                                path.replace(/\.[^.]+$/, ".txt"),
                                textToBase64(promptText),
                            );
                        }
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

                if (!sink) {
                    update(
                        `${chunkMessage}Packaging ${chunk.length} files into a zip…`,
                    );
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
                }
                Log(
                    `Chunk ${chunkIndex + 1} processed. Found ${medias.length} items.`,
                );
            }

            let saveNote: string | undefined;
            for (const download of downloads) {
                const res = await this.offscreen.download(
                    download.url,
                    download.filename,
                    { isBlob: true },
                    update,
                );
                if (res.note) saveNote = res.note;
                // Small delay to avoid browser hiccups starting many downloads
                await new Promise((resolve) =>
                    setTimeout(resolve, DOWNLOAD_THROTTLE_MS),
                );
            }

            // Caught up: remember the newest photo we just downloaded so the
            // next incremental run starts after it. Only when something saved.
            if (incremental && downloads.length > 0) {
                const newest = newestTimestamp(medias, (m) =>
                    String(m.completed),
                );
                if (newest) await setLastTimestamp("album", nomiId, newest);
            }

            if (!sink) {
                await new Promise((resolve) =>
                    setTimeout(resolve, ALBUM_FINALIZE_DELAY_MS),
                );
            }
            return saveNote;
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

    /**
     * The generation prompt to save alongside a media item. Art photos carry an
     * `artPrompt` (per-Nomi for group photos); edited photos and videos carry a
     * `textPrompt`. Plain selfies have nothing useful to attach. Videos can only
     * take a sidecar — `embedPrompt` writes PNG iTXt chunks, so mp4/webp fall
     * back to a `.txt` anyway.
     */
    private extractPrompt(media: Media, type: MediaType): string | null {
        if (type === "Art") {
            const prompt =
                media.artPrompt ??
                media.nomis?.find((n) => n.artPrompt)?.artPrompt;
            return prompt?.trim() || null;
        }
        if (type === "PhotoEdit" || type === "Video") {
            return media.textPrompt?.trim() || null;
        }
        return null;
    }

    /**
     * Narrow the chronological (oldest→newest) media list to the user's range.
     * `startIndex` is 1-based (oldest = #1); 0 = from the first. `recentLimit`
     * keeps only the most recent N of what remains; 0 = no limit. Composing them
     * means "start at #N, then keep the most recent N from there."
     */
    private applyRange(
        medias: Media[],
        startIndex: number,
        recentLimit: number,
    ): Media[] {
        let result = medias;
        if (startIndex > 1) result = result.slice(startIndex - 1);
        if (recentLimit > 0) result = result.slice(-recentLimit);
        return result;
    }

    /** Friendly label for progress text, e.g. "photo", "edited photo". */
    private mediaLabel(type: MediaType): string {
        switch (type) {
            case "Video":
                return "video";
            case "Art":
                return "art";
            case "PhotoEdit":
                return "edited photo";
            default:
                return "photo";
        }
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
