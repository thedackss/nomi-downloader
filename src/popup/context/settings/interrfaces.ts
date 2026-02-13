export interface Settings {
    list: {
        iconSize: "small" | "medium" | "large";
        iconShape: "circle" | "square" | "sharp";
    };
}

export type SettingsContextType = {
    Settings: Settings;
    setSettings: (value: Settings) => void;
};
