// Resolves a Nomi's export-header media (avatar/video) into data URIs so the
// downloaded HTML renders offline. Shared by the chat, mind map and shared
// notes exports so they all treat video profiles the same way.

import { api } from "../../nomi/http";
import { getNomiMedia } from "../../nomi/media";
import { Log } from "../../utils/log";
import {
    MEDIA_DOWNLOAD_TIMEOUT_MS,
    SELFIE_DOWNLOAD_TIMEOUT_MS,
} from "./constants";
import type { OffscreenClient } from "./offscreenClient";

export interface HeaderMedia {
    /** Still image data URI; also used as the poster for an embedded video. */
    avatar?: string;
    /** Profile video as an mp4 data URI; only set when embedding is on. */
    avatarVideo?: string;
}

async function fetchDataUri(
    url: string,
    mime: string,
    offscreen: OffscreenClient,
    timeout: number,
): Promise<string | undefined> {
    try {
        const { data } = await api.get(url, { responseType: "blob", timeout });
        const base64 = await offscreen.blobToBase64(data);
        return `data:${mime};base64,${base64}`;
    } catch (err) {
        Log("Failed to fetch header media", url, err);
        return undefined;
    }
}

/**
 * Resolve a Nomi's header media. The still prefers the video preview, then the
 * edit/selfie/base picture, so a video-profile Nomi (often without a plain
 * picture) still resolves. When `embedVideo` is set and the Nomi has a video,
 * the mp4 is embedded too and played with the still as its poster.
 */
export async function fetchHeaderMedia(
    nomi: Parameters<typeof getNomiMedia>[0],
    offscreen: OffscreenClient,
    embedVideo: boolean,
): Promise<HeaderMedia> {
    const media = getNomiMedia(nomi);
    const still =
        media.videoPrev || media.edit || media.selfie || media.default;

    const avatar = await fetchDataUri(
        still,
        "image/webp",
        offscreen,
        SELFIE_DOWNLOAD_TIMEOUT_MS,
    );
    const avatarVideo =
        embedVideo && media.video
            ? await fetchDataUri(
                  media.video,
                  "video/mp4",
                  offscreen,
                  MEDIA_DOWNLOAD_TIMEOUT_MS,
              )
            : undefined;

    return { avatar, avatarVideo };
}
