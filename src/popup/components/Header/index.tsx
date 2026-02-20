import { Settings } from "../Settings";
import styles from "./styles.module.scss";

export const Header = () => {
    return (
        <header className={styles.header}>
            <h1>Nomi Downloader</h1>
            <Settings />
        </header>
    );
};
