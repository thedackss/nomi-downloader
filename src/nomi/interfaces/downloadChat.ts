import type { NomiExistsProps } from "./exists";

export interface DownloadChatProps extends NomiExistsProps {
    includeSelfies?: boolean;
    /** Keep only the last N messages; 0 / undefined = unlimited. */
    maxMessages?: number;
    onProgress?: (message: string) => void;
}
