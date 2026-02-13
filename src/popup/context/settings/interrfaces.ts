export interface IconSettings {
    iconSize: "small" | "medium" | "large";
    iconShape: "circle" | "square" | "sharp";
}

export interface Settings {
    list: IconSettings;
}

export type SettingsContextType = {
    Settings: Settings;
    setSettings: (value: Settings) => void;
};
