import type { DownloadAlbumProps } from "./downloadAlbum";
import type { DownloadChatProps } from "./downloadChat";

/**
 * The single-button bundle download: everything about a Nomi packed into one
 * zip (index hub, chat, shared notes, mind map, JSON, album). Takes the same
 * album and chat options as the separated downloads; incremental mode does
 * not apply to bundles.
 */
export type DownloadBundleProps = Omit<DownloadAlbumProps, "incremental"> &
    Omit<DownloadChatProps, "incremental">;
