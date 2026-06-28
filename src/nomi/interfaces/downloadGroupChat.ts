export interface GroupChatInfo {
    type: string;
    /** ISO date string. */
    created: string;
    imageStyle: string;
    members: string[];
}

export interface GroupExportProps {
    groupId: number;
    /** Group name for the header and file name. */
    name: string;
    /** Group facts shown in the export. */
    info?: GroupChatInfo;
}

export interface DownloadGroupChatProps extends GroupExportProps {
    /** Embed selfie images in the exported HTML. */
    includeSelfies: boolean;
    /** Keep only the last N items; 0 / undefined = unlimited. */
    maxMessages?: number;
    /** Max messages per file; 0 / undefined = no count cap (size only). */
    messagesPerFile?: number;
    /** Max estimated size per file, in MB; 0 / undefined = built-in safe cap. */
    maxFileSizeMB?: number;
    onProgress?: (message: string) => void;
}
