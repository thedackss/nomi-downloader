export interface DownloadGroupChatProps {
    groupId: number;
    /** Group name for the header and file name. */
    name: string;
    /** Embed selfie images in the exported HTML. */
    includeSelfies: boolean;
    /** Keep only the last N items; 0 / undefined = unlimited. */
    maxMessages?: number;
    onProgress?: (message: string) => void;
}
