import { useState } from "react";
import { useNomi } from "../../hooks/useNomi";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";

/**
 * Full-popup state shown instead of the list/info panes when the companion
 * lists can't load: logged out of nomi.ai, or nomi.ai unreachable. Replaces
 * what used to be an endless loading spinner.
 */
export const ConnectionState = () => {
    const { Nomis, fetchNomis, fetchGroups } = useNomi();
    const [retrying, setRetrying] = useState(false);

    async function retry() {
        setRetrying(true);
        await fetchGroups();
        await fetchNomis();
        setRetrying(false);
    }

    if (retrying) {
        return (
            <div className={styles.wrap}>
                <LoadingSpin visible />
            </div>
        );
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.card}>
                {Nomis.loadError === "auth" ? (
                    <>
                        <p className={styles.title}>Log in to nomi.ai</p>
                        <p className={styles.hint}>
                            The extension uses your own nomi.ai session to find
                            your companions. Log in, then open the popup again.
                        </p>
                        <div className={styles.actions}>
                            <a
                                href="https://beta.nomi.ai"
                                target="_blank"
                                rel="noopener">
                                Open nomi.ai
                            </a>
                            <button type="button" onClick={retry}>
                                Check again
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className={styles.title}>Couldn't reach nomi.ai</p>
                        <p className={styles.hint}>
                            Check your connection, or nomi.ai may be having
                            trouble right now.
                        </p>
                        <div className={styles.actions}>
                            <button type="button" onClick={retry}>
                                Try again
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
