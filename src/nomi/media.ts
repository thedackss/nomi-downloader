const API = "https://beta.nomi.ai/api";

interface NomiMediaSource {
    id: number;
    /**
     * The avatar as a media item. Since 2026-09 this is the only picture
     * reference the API returns; the per-type ids below were removed.
     */
    pictureMediaItemUuid?: string | null;
    /** "SelfieImage" | "CharacterImage" | "EditedImage" | "Video". */
    pictureMediaItemType?: string | null;
    /** Legacy ids, kept as a fallback for responses that still carry them. */
    pictureImageId?: string | null;
    pictureSelfieImageId?: string | null;
    imageEditRequestUuid?: string | null;
    videoRequestUuid?: string | null;
}

export interface NomiMedia {
    default: string;
    selfie?: string;
    edit?: string;
    video?: string;
    videoPrev?: string;
}

/** Build the set of media URLs (image, selfie, edit, video, preview) for a Nomi. */
export function getNomiMedia(nomi: NomiMediaSource): NomiMedia {
    // Current API: one media item covers every picture type. Its image.webp
    // is the picture itself, or the poster frame when the item is a video.
    if (nomi.pictureMediaItemUuid) {
        const item = `${API}/media-items/${nomi.pictureMediaItemUuid}`;
        const still = `${item}/image.webp`;
        const isVideo = nomi.pictureMediaItemType === "Video";

        return {
            default: still,
            video: isVideo ? `${item}/video.mp4` : undefined,
            videoPrev: isVideo ? still : undefined,
        };
    }

    const base = `${API}/nomis/${nomi.id}`;

    return {
        default: `${base}/images/${nomi.pictureImageId}.webp`,
        selfie: nomi.pictureSelfieImageId
            ? `${base}/selfies/${nomi.pictureSelfieImageId}.webp`
            : undefined,
        edit: nomi.imageEditRequestUuid
            ? `${API}/image-edit-requests/${nomi.imageEditRequestUuid}/edited-image.webp`
            : undefined,
        video: nomi.videoRequestUuid
            ? `${API}/video-requests/${nomi.videoRequestUuid}.mp4`
            : undefined,
        videoPrev: nomi.videoRequestUuid
            ? `${API}/video-requests/${nomi.videoRequestUuid}/preview.webp`
            : undefined,
    };
}

/** Still image for a Nomi, preferring a custom edit, then a selfie, then the base picture. */
export function getNomiImageUrl(nomi: NomiMediaSource): string {
    const media = getNomiMedia(nomi);
    return media.edit ?? media.selfie ?? media.default;
}
