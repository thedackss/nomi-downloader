import { useState } from "react";
import {
    CHANGELOG_URL,
    MANUAL_UPDATE_HINT,
    requestChromeUpdate,
    STORE_URL,
    type UpdateResult,
} from "../../../utils/version";
import { useUpdateCheck } from "../../hooks/useUpdateCheck";
import styles from "./styles.module.scss";

/**
 * A dismissible banner shown across the top of the popup when a newer version
 * is published. Hidden when up to date, offline, or the check hasn't resolved.
 *
 * On Chrome the action triggers a real Web Store update check (and reload);
 * Firefox has no such API, so it links to the store's release notes instead.
 */
export const UpdateBanner = () => {
    const update = useUpdateCheck();
    const [dismissed, setDismissed] = useState(false);
    const [result, setResult] = useState<UpdateResult | null>(null);
    const [busy, setBusy] = useState(false);

    if (!update?.outdated || dismissed) return null;

    async function onUpdate() {
        setBusy(true);
        // "updating" reloads the extension (this popup closes); any other
        // result means auto-update couldn't run, so we reveal the manual hint.
        setResult(await requestChromeUpdate());
        setBusy(false);
    }

    // Chrome couldn't self-update (throttled, dev build, already latest): point
    // to the store and surface the manual steps in the tooltip.
    const failed = result !== null && result !== "updating";

    const resultLabel =
        result === "throttled"
            ? "Try again shortly"
            : result === "no_update"
              ? "Already latest"
              : "Update manually";

    return (
        <div className={styles.banner}>
            <span className={styles.text}>
                v{update.latest} is available (you have v{update.current}) — it
                updates automatically.
            </span>

            {__IS_FIREFOX__ ? (
                <a
                    className={styles.action}
                    href={CHANGELOG_URL}
                    target="_blank"
                    rel="noreferrer"
                    title={MANUAL_UPDATE_HINT}>
                    What's new
                </a>
            ) : failed ? (
                <a
                    className={styles.action}
                    href={STORE_URL}
                    target="_blank"
                    rel="noreferrer"
                    title={MANUAL_UPDATE_HINT}>
                    {resultLabel}
                </a>
            ) : (
                <button
                    type="button"
                    className={styles.action}
                    disabled={busy}
                    onClick={onUpdate}>
                    {busy ? "Checking…" : "Update now"}
                </button>
            )}

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
