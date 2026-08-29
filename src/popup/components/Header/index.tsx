import { SITE_URL } from "../../../utils/site";
import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { Settings } from "../Settings";
import { RiSettingsLine } from "../Settings/RiSettingsLine";
import styles from "./styles.module.scss";

export const Header = () => {
    const { Nomis, clearSelection } = useNomi();
    const { isMobile, menuOpen, setMenuOpen } = useSettings();
    const hasSelection = Nomis.selected.nomi || Nomis.selected.group;

    return (
        <header className={styles.header}>
            {!(isMobile && hasSelection) && (
                <a
                    className={styles.tip}
                    href={`${SITE_URL}/tip`}
                    target="_blank"
                    rel="noreferrer"
                    title="Enjoying the extension? Send a tip">
                    <svg role="img" viewBox="0 0 24 24" width="20" height="20">
                        <title>Send a tip</title>
                        <path
                            fill="currentColor"
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        />
                    </svg>
                </a>
            )}
            {isMobile && hasSelection && (
                <button
                    type="button"
                    className={styles.backButton}
                    onClick={clearSelection}
                    aria-label="Back to list">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20">
                        <path
                            fill="currentColor"
                            d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                        />
                    </svg>
                </button>
            )}
            <h1>Nomi Downloader</h1>
            <button
                type="button"
                aria-label="Toggle settings"
                className={`${styles.settingsButton}${menuOpen ? ` ${styles.active}` : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}>
                <RiSettingsLine />
                <RiSettingsLine />
            </button>
            <Settings />
        </header>
    );
};
