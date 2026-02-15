import type { Settings } from "../context/settings/interrfaces";
import { SettingsContext } from "../context/settings";
import { useContext } from "react";
import { Log } from "../../utils/log";

export const useSettings = () => {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }

    const { Settings, setSettings } = context;

    async function InitializeSettings() {
        const storedConfig = localStorage.getItem("config");
        if (!storedConfig) {
            localStorage.setItem("config", JSON.stringify(Settings));
            Log("Initialized default settings in localStorage");
        } else {
            const parsedConfig: Settings = JSON.parse(storedConfig);
            setSettings(parsedConfig);
            Log("Loaded settings from localStorage");
        }
    }

    return { Settings, InitializeSettings };
};
