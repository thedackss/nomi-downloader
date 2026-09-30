import { createContext, type FC, useState } from "react";
import type { ReactElement } from "../../interfaces/reactElement";
import type { Settings, SettingsContextType } from "./interfaces";

const SettingsContext = createContext<SettingsContextType | null>(null);

const SettingsProvider: FC<ReactElement> = ({ children }) => {
    const Default: Settings = {
        list: { iconShape: "circle", iconSize: "medium" },
        download: {
            advanced: false,
            all: true,
            album: true,
            chat: true,
            mindMap: true,
            sharedNotes: true,
            json: true,
            markdown: true,
            chatMarkdown: true,
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
            // On by default: the prompt behind an Art / edited image is part of
            // the memory worth backing up. A sidecar works for every format.
            prompts: "sidecar",
            recentLimit: 0,
            startIndex: 0,
        },
        chatDownload: {
            maxMessages: 0,
            rangeStart: 0,
            rangeEnd: 0,
            messagesPerFile: 0,
            maxFileSizeMB: 0,
            // On by default so a chat-only export is self-contained. The
            // bundle does not duplicate anything: it links each selfie to the
            // album copy already in the zip and only embeds the ones the
            // album left out.
            includeSelfies: true,
            includeVoiceAudio: false,
            voiceAudioRecentLimit: 0,
        },
        jsonDownload: {
            rawData: false,
        },
        incremental: {
            enabled: false,
        },
        textSize: "normal",
        showStats: false,
        statsSync: false,
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
