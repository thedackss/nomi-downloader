import type { GetMediasProps } from "./getMedias";

export interface DownloadAlbumProps extends GetMediasProps {
    quality?: "HD" | "SD";
    folderization?: boolean;
    downloadQuantity?: number;
    /** Max images per zip; 0 / undefined = auto (size-based chunking only). */
    imagesPerZip?: number;
    /** Save Art/PhotoEdit prompts: off | sidecar .txt | embed in image | both. */
    prompts?: "off" | "sidecar" | "embed" | "both";
}
