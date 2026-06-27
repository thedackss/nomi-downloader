export interface IconSettings {
    iconSize: "small" | "medium" | "large" | "xlarge";
    iconShape: "circle" | "square" | "sharp";
}

export interface DownloadSettings {
    /** Show per-type toggles + a select button instead of one combined button. */
    advanced: boolean;
    album: boolean;
    chat: boolean;
    mindMap: boolean;
    sharedNotes: boolean;
    json: boolean;
    markdown: boolean;
}

export interface Settings {
    list: IconSettings;
    /** Which download types are offered, and whether advanced mode is on. */
    download: DownloadSettings;
    albumDownload: {
        quality: "HD" | "SD";
        folderization: boolean;
        downloadQuantity: number;
        /** Max images per zip; 0 = auto (size-based chunking only). */
        imagesPerZip: number;
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
        /** Embed selfie images in the exported chat HTML. */
        includeSelfies: boolean;
    };
    jsonDownload: {
        /** Also include the full, unprocessed Nomi API responses. */
        rawData: boolean;
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
