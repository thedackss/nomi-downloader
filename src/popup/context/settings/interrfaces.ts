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
    };
}

export type SettingsContextType = {
    Settings: Settings;
    setSettings: (value: Settings) => void;
};
