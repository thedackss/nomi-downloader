import { useContext } from "react";
import { deepMerge } from "../../utils/deepMerge";
import { Log, setDebugLogging } from "../../utils/log";
import { SettingsContext } from "../context/settings";
import type { Settings } from "../context/settings/interfaces";

export const useSettings = () => {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }

    const { Settings, setSettings, menuOpen, setMenuOpen } = context;

    async function InitializeSettings() {
        const storedConfig = localStorage.getItem("config");
        if (!storedConfig) {
            localStorage.setItem("config", JSON.stringify(Settings));
            Log("Initialized default settings in localStorage");
        } else {
            try {
                const parsedConfig: Settings = JSON.parse(storedConfig);

                // Check if parsedConfig is an object and not null
                if (!parsedConfig || typeof parsedConfig !== "object") {
                    throw new Error("Invalid format in localStorage");
                }

                // Merge with default settings to ensure new properties are present
                const mergedConfig: Settings = deepMerge(
                    Settings,
                    parsedConfig,
                );

                setSettings(mergedConfig);
                setDebugLogging(mergedConfig.debug);

                // Update local storage with the merged config (including new defaults)
                localStorage.setItem("config", JSON.stringify(mergedConfig));

                Log("Loaded and merged settings from localStorage");
            } catch (error) {
                console.error(
                    "Failed to parse settings, resetting to defaults",
                    error,
                );
                localStorage.setItem("config", JSON.stringify(Settings));
                setSettings(Settings);
            }
        }
    }

    const updateSettings = (newSettings: Partial<Settings>) => {
        const mergedSettings = deepMerge(Settings, newSettings);
        setSettings(mergedSettings);
        setDebugLogging(mergedSettings.debug);
        localStorage.setItem("config", JSON.stringify(mergedSettings));
    };

    // Portrait viewport = the mobile layout (Firefox Android renders the
    // popup as a full page). A manual override used to exist, but forcing
    // "mobile" inside a desktop popup collapses it: the popup sizes itself
    // from content, and dvw/dvh-sized content has nothing to size against.
    const isMobile = window.innerHeight >= window.innerWidth;

    return {
        Settings,
        InitializeSettings,
        updateSettings,
        isMobile,
        menuOpen,
        setMenuOpen,
    };
};
