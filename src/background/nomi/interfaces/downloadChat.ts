import type { NomiExistsProps } from "./exists";

export interface DownloadChatProps extends NomiExistsProps {
    includeSelfies?: boolean;
    onProgress?: (message: string) => void;
}
