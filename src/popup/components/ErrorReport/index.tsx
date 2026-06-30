import { useState } from "react";
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

    async function handleSend() {
        setSendState("sending");
        const ok = await sendReport(report.text);
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
