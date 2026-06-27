export interface GroupChatInfo {
    type: string;
    /** ISO date string. */
    created: string;
    imageStyle: string;
    members: string[];
}

export interface DownloadGroupChatProps {
    groupId: number;
    /** Group name for the header and file name. */
    name: string;
    /** Group facts shown in an info card at the top of the export. */
    info?: GroupChatInfo;
    /** Embed selfie images in the exported HTML. */
    includeSelfies: boolean;
    /** Keep only the last N items; 0 / undefined = unlimited. */
    maxMessages?: number;
    onProgress?: (message: string) => void;
}
