import { useEffect, useRef, useState } from "react";
import { NomiApiClient } from "../../../nomi/api";
import type { PendingReport } from "../../context/errorReport";
import { sendReport } from "../../report/sendReport";
import styles from "./styles.module.scss";

type SendState = "idle" | "sending" | "sent" | "failed";

interface Props {
    report: PendingReport;
    onClose: () => void;
}

/** "An error happened — send a report?" Yes/No prompt shown over the popup. */
export const ErrorReportModal = ({ report, onClose }: Props) => {
    const [sendState, setSendState] = useState<SendState>("idle");
    // Optional: link the report to the account so a reply can reach this user
    // right in the extension (auto-reports carry no contact info otherwise).
    const [accountEmail, setAccountEmail] = useState("");
    const [includeEmail, setIncludeEmail] = useState(true);
    const emailFetched = useRef(false);

    useEffect(() => {
        if (emailFetched.current) return;
        emailFetched.current = true;
        // Ignore failures (e.g. not signed in): the report still sends,
        // just without an email to reply to.
        new NomiApiClient()
            .getUserInfo()
            .then((me) => setAccountEmail(me.email))
            .catch(() => {});
    }, []);

    async function handleSend() {
        setSendState("sending");
        const ok = await sendReport(report.text, {
            summary: report.message,
            accountEmail: includeEmail ? accountEmail : undefined,
        });
        setSendState(ok ? "sent" : "failed");
        if (ok) setTimeout(onClose, 1500);
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <h2>Something went wrong</h2>
                <p className={styles.message}>{report.message}</p>

                {sendState === "sent" ? (
                    <p className={styles.sent}>Thanks — report sent.</p>
                ) : (
                    <>
                        <p className={styles.ask}>
                            Send an error report so this can be fixed?
                        </p>

                        <details className={styles.details}>
                            <summary>What gets sent</summary>
                            <pre>{report.text}</pre>
                        </details>

                        {accountEmail && (
                            <label className={styles.consentRow}>
                                <input
                                    type="checkbox"
                                    checked={includeEmail}
                                    onChange={(e) =>
                                        setIncludeEmail(e.target.checked)
                                    }
                                />
                                <span>
                                    Link this report to my account (
                                    <strong>{accountEmail}</strong>) so a reply
                                    can appear right here in the extension.
                                </span>
                            </label>
                        )}

                        {sendState === "failed" && (
                            <p className={styles.failed}>
                                Couldn't send the report. Try again?
                            </p>
                        )}

                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={styles.secondary}
                                onClick={onClose}
                                disabled={sendState === "sending"}>
                                Not now
                            </button>
                            <button
                                type="button"
                                className={styles.primary}
                                onClick={handleSend}
                                disabled={sendState === "sending"}>
                                {sendState === "sending"
                                    ? "Sending…"
                                    : sendState === "failed"
                                      ? "Retry"
                                      : "Send report"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
