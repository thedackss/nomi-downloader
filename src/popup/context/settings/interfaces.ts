export interface IconSettings {
    iconSize: "small" | "medium" | "large" | "xlarge";
    iconShape: "circle" | "square" | "sharp";
}

/** The per-type keys offered on the separated-downloads split button. */
export type DownloadTypeKey =
    | "album"
    | "chat"
    | "mindMap"
    | "sharedNotes"
    | "json"
    | "markdown";

export interface DownloadSettings {
    /** Show per-type toggles + a select button instead of one combined button. */
    advanced: boolean;
    album: boolean;
    chat: boolean;
    mindMap: boolean;
    sharedNotes: boolean;
    json: boolean;
    markdown: boolean;
    /** Last type picked on the split button, remembered across sessions. */
    lastType: DownloadTypeKey;
    /** Same, for group chats (which offer fewer types). */
    lastGroupType: "chat" | "json" | "markdown";
    /**
     * When a Nomi's profile is a video, embed that video in the chat / mind map
     * / shared notes HTML headers instead of a still frame. Larger files.
     */
    embedHeaderVideo: boolean;
}

export interface Settings {
    list: IconSettings;
    /** Which download types are offered, and whether advanced mode is on. */
    download: DownloadSettings;
    albumDownload: {
        quality: "HD" | "SD";
        folderization: boolean;
        downloadQuantity: number;
        /** Keep only the most recent N photos; 0 = all. Applied after startIndex. */
        recentLimit: number;
        /**
         * Start at photo #N in the album (1-based, oldest = #1); 0 = from the
         * first. Composes with recentLimit (skip to #N, then keep the recent N).
         */
        startIndex: number;
        /** Max images per zip; 0 = auto (size-based chunking only). */
        imagesPerZip: number;
        /**
         * Max estimated size per zip, in MB. The zip is built in memory, so this
         * is a safety floor against multi-GB zips; raise it to split less often.
         */
        maxZipSizeMB: number;
        /**
         * Save the generation prompt for Art / edited photos:
         * off | sidecar .txt | embedded in the image | both.
         * Embedding only applies to PNG (HD); WebP/video fall back to a sidecar.
         */
        prompts: "off" | "sidecar" | "embed" | "both";
    };
    chatDownload: {
        /** Keep only the last N messages; 0 = unlimited. */
        maxMessages: number;
        /**
         * Explicit message range (1-based, inclusive, oldest = #1). When either
         * bound is set it takes precedence over maxMessages. 0 = open end.
         */
        rangeStart: number;
        rangeEnd: number;
        /** Max messages per exported file; 0 = no count cap (size only). */
        messagesPerFile: number;
        /** Max estimated size per file, in MB; 0 = built-in safe cap. */
        maxFileSizeMB: number;
        /** Embed selfie images in the exported chat HTML. */
        includeSelfies: boolean;
        /** Download voice message audio with chat/bundle exports. */
        includeVoiceAudio: boolean;
        /** Keep only the most recent N voice audios; 0 = all. */
        voiceAudioRecentLimit: number;
    };
    jsonDownload: {
        /** Also include the full, unprocessed Nomi API responses. */
        rawData: boolean;
    };
    /**
     * BETA. When on, album / chat / group downloads fetch only content newer
     * than the last successful download (tracked per Nomi/group by timestamp).
     * Off by default; the Reset button forgets the history.
     */
    incremental: {
        enabled: boolean;
    };
    layout: "auto" | "mobile" | "desktop";
    /** Show a daily-usage stats panel under the header. */
    showStats: boolean;
    /** Verbose logging in the console for troubleshooting. */
    debug: boolean;
}

export type SettingsContextType = {
    Settings: Settings;
    setSettings: (value: Settings) => void;
    /** Whether the settings menu overlay is open. */
    menuOpen: boolean;
    setMenuOpen: (value: boolean) => void;
};
