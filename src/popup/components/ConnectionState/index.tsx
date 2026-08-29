import { useState } from "react";
import { useNomi } from "../../hooks/useNomi";
import { HELP_URL } from "../../../utils/site";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";

/**
 * Full-popup state shown instead of the list/info panes when the companion
 * lists can't load: logged out of nomi.ai, the nomi.ai permission revoked
 * (Firefox host permissions are user-revocable), or nomi.ai unreachable.
 * Replaces what used to be an endless loading spinner.
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

    // Must run directly in the click handler: permissions.request needs the
    // user gesture. On grant, the lists load right away.
    async function grantAccess() {
        try {
            const granted = await chrome.permissions.request({
                origins: ["https://*.nomi.ai/*"],
            });
            if (granted) await retry();
        } catch {
            // Request refused or unavailable; the card stays for another try.
        }
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
                ) : Nomis.loadError === "permission" ? (
                    <>
                        <p className={styles.title}>
                            Allow access to nomi.ai
                        </p>
                        <p className={styles.hint}>
                            The extension needs permission to read your own
                            nomi.ai data — it looks like that access was
                            turned off in the browser's add-on settings.
                        </p>
                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={styles.primary}
                                onClick={grantAccess}>
                                Grant access
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
                <a
                    className={styles.helpLink}
                    href={HELP_URL}
                    target="_blank"
                    rel="noopener">
                    Need help? Open the guide
                </a>
            </div>
        </div>
    );
};
