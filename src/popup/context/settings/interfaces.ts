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
    };
    layout: "auto" | "mobile" | "desktop";
}

export type SettingsContextType = {
    Settings: Settings;
    setSettings: (value: Settings) => void;
};
