const API = "https://beta.nomi.ai/api";

interface NomiMediaSource {
    id: number;
    pictureImageId: string;
    pictureSelfieImageId?: string | null;
    videoRequestUuid?: string | null;
}

export interface NomiMedia {
    default: string;
    selfie?: string;
    video?: string;
    videoPrev?: string;
}

/** Build the set of media URLs (image, selfie, video, preview) for a Nomi. */
export function getNomiMedia(nomi: NomiMediaSource): NomiMedia {
    const base = `${API}/nomis/${nomi.id}`;

    return {
        default: `${base}/images/${nomi.pictureImageId}.webp`,
        selfie: nomi.pictureSelfieImageId
            ? `${base}/selfies/${nomi.pictureSelfieImageId}.webp`
            : undefined,
        video: nomi.videoRequestUuid
            ? `${API}/video-requests/${nomi.videoRequestUuid}.mp4`
            : undefined,
        videoPrev: nomi.videoRequestUuid
            ? `${API}/video-requests/${nomi.videoRequestUuid}/preview.webp`
            : undefined,
    };
}

/** Still image for a Nomi, preferring the selfie over the default picture. */
export function getNomiImageUrl(nomi: NomiMediaSource): string {
    const media = getNomiMedia(nomi);
    return media.selfie ?? media.default;
}
