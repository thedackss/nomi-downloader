const API = "https://beta.nomi.ai/api";

interface NomiMediaSource {
    id: number;
    pictureImageId: string;
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
