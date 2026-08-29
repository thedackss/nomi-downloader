import { type FC, useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { AdvancedSection } from "./sections/AdvancedSection";
import { AlbumSection } from "./sections/AlbumSection";
import { ChatSection } from "./sections/ChatSection";
import { ExportsSection } from "./sections/ExportsSection";
import { HelpSection } from "./sections/HelpSection";
import { InterfaceSection } from "./sections/InterfaceSection";
import styles from "./styles.module.scss";

type SectionId =
    | "interface"
    | "album"
    | "chat"
    | "exports"
    | "advanced"
    | "help";

const SECTIONS: Array<{ id: SectionId; label: string; Component: FC }> = [
    { id: "interface", label: "Interface", Component: InterfaceSection },
    { id: "album", label: "Album", Component: AlbumSection },
    { id: "chat", label: "Chat", Component: ChatSection },
    { id: "exports", label: "Exports", Component: ExportsSection },
    { id: "advanced", label: "Advanced", Component: AdvancedSection },
    { id: "help", label: "Help", Component: HelpSection },
];

/**
 * The settings page: a full-popup overlay with a section nav rail on the left
 * (top chips on mobile) and the active section's rows on the right. The gear
 * in the Header stays above the overlay and toggles it.
 */
export const Settings = () => {
    const { menuOpen } = useSettings();
    const [active, setActive] = useState<SectionId>("interface");
    const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

    const version =
        typeof chrome !== "undefined"
            ? chrome.runtime.getManifest().version
            : "";

    return (
        <div
            className={`${styles.page}${menuOpen ? ` ${styles.visible}` : ""}`}>
            <div className={styles.pageHeader}>
                <h2>Settings</h2>
                {version && <span className={styles.version}>v{version}</span>}
            </div>
            <div className={styles.body}>
                <nav className={styles.nav}>
                    {SECTIONS.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            className={
                                active === s.id ? styles.activeNav : undefined
                            }
                            onClick={() => setActive(s.id)}>
                            {s.label}
                        </button>
                    ))}
                </nav>
                <div className={styles.content}>
                    <current.Component />
                </div>
            </div>
        </div>
    );
};
