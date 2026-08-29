import { createContext, type FC, useState } from "react";
import type { ReactElement } from "../../interfaces/reactElement";
import type { Settings, SettingsContextType } from "./interfaces";

const SettingsContext = createContext<SettingsContextType | null>(null);

const SettingsProvider: FC<ReactElement> = ({ children }) => {
    const Default: Settings = {
        list: { iconShape: "circle", iconSize: "medium" },
        download: {
            advanced: false,
            album: true,
            chat: true,
            mindMap: true,
            sharedNotes: true,
            json: true,
            markdown: true,
            lastType: "album",
            lastGroupType: "chat",
            embedHeaderVideo: false,
        },
        albumDownload: {
            quality: "SD",
            folderization: true,
            downloadQuantity: 2,
            imagesPerZip: 0,
            maxZipSizeMB: 750,
            prompts: "off",
            recentLimit: 0,
            startIndex: 0,
        },
        chatDownload: {
            maxMessages: 0,
            rangeStart: 0,
            rangeEnd: 0,
            messagesPerFile: 0,
            maxFileSizeMB: 0,
            // Off by default: the simple download already grabs the album, so
            // embedding selfies in the chat too would just duplicate them.
            includeSelfies: false,
            includeVoiceAudio: false,
            voiceAudioRecentLimit: 0,
        },
        jsonDownload: {
            rawData: false,
        },
        incremental: {
            enabled: false,
        },
        layout: "auto",
        showStats: false,
        debug: false,
    };

    const [Settings, setSettings] = useState<Settings>(Default);
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <SettingsContext.Provider
            value={{
                Settings,
                setSettings,
                menuOpen,
                setMenuOpen,
            }}>
            {children}
        </SettingsContext.Provider>
    );
};

export { SettingsContext, SettingsProvider };
