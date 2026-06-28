import type { NomiExistsProps } from "./exists";

export interface DownloadChatProps extends NomiExistsProps {
    includeSelfies?: boolean;
    /** Keep only the last N messages; 0 / undefined = unlimited. */
    maxMessages?: number;
    /**
     * Explicit message range (1-based, inclusive, oldest = #1). When either
     * bound is set it takes precedence over maxMessages. 0 / undefined = open.
     */
    rangeStart?: number;
    rangeEnd?: number;
    /** BETA: download only messages newer than the last successful run. */
    incremental?: boolean;
    /** Max messages per file; 0 / undefined = no count cap (size only). */
    messagesPerFile?: number;
    /** Max estimated size per file, in MB; 0 / undefined = built-in safe cap. */
    maxFileSizeMB?: number;
    onProgress?: (message: string) => void;
}
