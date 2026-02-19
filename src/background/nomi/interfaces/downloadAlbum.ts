import type { GetMediasProps } from "./getMedias";

export interface DownloadAlbumProps extends GetMediasProps {
    chunkSize?: number;
    quality?: "HD" | "SD";
    folderization?: boolean;
    downloadQuantity?: number;
}
