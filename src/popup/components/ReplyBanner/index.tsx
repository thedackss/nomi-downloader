import { useState } from "react";
import { useReplies } from "../../hooks/useReplies";
import { useSettings } from "../../hooks/useSettings";
// Same look as the update banner; only the message differs.
import styles from "../UpdateBanner/styles.module.scss";

/**
 * Shown when the developer answered one of this install's bug reports and
 * the reply hasn't been viewed yet. Dismiss hides it for this popup only —
 * opening Settings → Help (where the reply lives) is what marks it seen.
 */
export const ReplyBanner = () => {
    const { unseen } = useReplies();
    // Hidden while settings is open (same reason as the update banner); the
    // dot on the Tickets nav item takes over there.
    const { menuOpen } = useSettings();
    const [dismissed, setDismissed] = useState(false);

    if (unseen === 0 || dismissed || menuOpen) return null;

    return (
        <div className={styles.banner}>
            <span className={styles.text}>
                The developer replied to your bug report — see Settings →
                Tickets.
            </span>
            <button
                type="button"
                className={styles.dismiss}
                aria-label="Dismiss"
                onClick={() => setDismissed(true)}>
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16">
                    <path
                        fill="currentColor"
                        d="M18.3 5.71L12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.3l6.29 6.29 6.3-6.29z"
                    />
                </svg>
            </button>
        </div>
    );
};
