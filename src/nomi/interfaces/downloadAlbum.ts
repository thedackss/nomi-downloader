import type { GetMediasProps } from "./getMedias";

export interface DownloadAlbumProps extends GetMediasProps {
    quality?: "HD" | "SD";
    folderization?: boolean;
    downloadQuantity?: number;
}
