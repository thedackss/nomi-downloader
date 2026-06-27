export interface IconSettings {
    iconSize: "small" | "medium" | "large" | "xlarge";
    iconShape: "circle" | "square" | "sharp";
}

export interface Settings {
    list: IconSettings;
    albumDownload: {
        quality: "HD" | "SD";
        folderization: boolean;
        downloadQuantity: number;
        /** Max images per zip; 0 = auto (size-based chunking only). */
        imagesPerZip: number;
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
};
