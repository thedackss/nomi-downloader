import type { Settings, SettingsContextType } from "./interrfaces";
import type { ReactElement } from "../../interfaces/reactElement";
import { createContext, useState, type FC } from "react";

const SettingsContext = createContext<SettingsContextType | null>(null);

const SettingsProvider: FC<ReactElement> = ({ children }) => {
    const Default: Settings = {
        list: { iconShape: "circle", iconSize: "medium" },
        albumDownload: {
            quality: "SD",
            folderization: true,
            downloadQuantity: 2,
        },
        layout: "auto",
    };

    const [Settings, setSettings] = useState<Settings>(Default);

    return (
        <SettingsContext.Provider
            value={{
                Settings,
                setSettings,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export { SettingsContext, SettingsProvider };
