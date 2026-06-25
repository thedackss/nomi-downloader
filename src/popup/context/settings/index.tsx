import { createContext, type FC, useState } from "react";
import type { ReactElement } from "../../interfaces/reactElement";
import type { Settings, SettingsContextType } from "./interfaces";

const SettingsContext = createContext<SettingsContextType | null>(null);

const SettingsProvider: FC<ReactElement> = ({ children }) => {
    const Default: Settings = {
        list: { iconShape: "circle", iconSize: "medium" },
        albumDownload: {
            quality: "SD",
            folderization: true,
            downloadQuantity: 2,
            imagesPerZip: 0,
        },
        chatDownload: {
            maxMessages: 0,
            includeSelfies: true,
        },
        layout: "auto",
    };

    const [Settings, setSettings] = useState<Settings>(Default);

    return (
        <SettingsContext.Provider
            value={{
                Settings,
                setSettings,
            }}>
            {children}
        </SettingsContext.Provider>
    );
};

export { SettingsContext, SettingsProvider };
