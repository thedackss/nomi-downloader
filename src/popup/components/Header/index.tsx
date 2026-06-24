import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { Settings } from "../Settings";
import styles from "./styles.module.scss";

export const Header = () => {
    const { Nomis, clearSelection } = useNomi();
    const { isMobile } = useSettings();
    const hasSelection = Nomis.selected.nomi || Nomis.selected.group;

    return (
        <header className={styles.header}>
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
            <Settings />
        </header>
    );
};
