import { useRef, useState } from "react";
import { NomiApiClient } from "../../../../nomi/api";
import { buildLogsText, buildUserReportText } from "../../../../utils/report";
import { MANUAL_UPDATE_HINT, STORE_URL } from "../../../../utils/version";
import { useUpdateCheck } from "../../../hooks/useUpdateCheck";
import { sendReport } from "../../../report/sendReport";
import styles from "../styles.module.scss";

/**
 * Help section: copy the recent logs, or send a described bug report (with a
 * reply-to email prefilled from the account). Also shows the version.
 */
export const HelpSection = () => {
    const version =
        typeof chrome !== "undefined"
            ? chrome.runtime.getManifest().version
            : "";

    const [reportOpen, setReportOpen] = useState(false);
    const [reportText, setReportText] = useState("");
    const [reportName, setReportName] = useState("");
    const [reportEmail, setReportEmail] = useState("");
    const emailFetched = useRef(false);
    const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
        "idle",
    );
    const [sendState, setSendState] = useState<
        "idle" | "sending" | "sent" | "failed"
    >("idle");

    // Shared with the main-view banner (one request per popup); null = unknown
    // (offline or the check failed), in which case we show nothing extra.
    const update = useUpdateCheck();

    async function copyLogs() {
        try {
            await navigator.clipboard.writeText(await buildLogsText());
            setCopyState("copied");
        } catch {
            setCopyState("failed");
        }
        setTimeout(() => setCopyState("idle"), 2000);
    }

    function toggleReportForm() {
        setReportOpen(!reportOpen);
        if (reportOpen || emailFetched.current) return;
        emailFetched.current = true;
        // Prefill the name and reply-to email from the account; ignore
        // failures (e.g. not signed in) and leave the fields editable.
        new NomiApiClient()
            .getUserInfo()
            .then((me) => {
                setReportName((prev) => prev || me.profile.name);
                setReportEmail((prev) => prev || me.email);
            })
            .catch(() => {});
    }

    async function submitReport() {
        setSendState("sending");
        const text = await buildUserReportText(
            reportText,
            reportEmail,
            reportName,
        );
        const ok = await sendReport(text);
        setSendState(ok ? "sent" : "failed");
        if (ok) {
            setTimeout(() => {
                setReportOpen(false);
                setReportText("");
                setSendState("idle");
            }, 1500);
        }
    }

    return (
        <>
            <p className={styles.helpIntro}>
                Something broke, or behaving oddly? Copy the recent activity
                logs to share, or send a report directly.
            </p>

            <div className={styles.report}>
                <button type="button" onClick={copyLogs}>
                    {copyState === "copied"
                        ? "Copied!"
                        : copyState === "failed"
                          ? "Copy failed"
                          : "Copy logs"}
                </button>
                <button
                    type="button"
                    className={reportOpen ? styles.active : undefined}
                    onClick={toggleReportForm}>
                    Report a bug
                </button>
            </div>

            {reportOpen && (
                <div className={styles.reportForm}>
                    <textarea
                        placeholder="What happened? What were you doing when it broke?"
                        rows={3}
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email for a reply (optional)"
                        value={reportEmail}
                        onChange={(e) => setReportEmail(e.target.value)}
                    />
                    <div className={styles.reportActions}>
                        <p>
                            Sends your description, name, contact info and
                            recent activity logs. No cookies or tokens.
                        </p>
                        <button
                            type="button"
                            disabled={
                                !reportText.trim() ||
                                sendState === "sending" ||
                                sendState === "sent"
                            }
                            onClick={submitReport}>
                            {sendState === "sending"
                                ? "Sending…"
                                : sendState === "sent"
                                  ? "Sent — thanks!"
                                  : sendState === "failed"
                                    ? "Retry"
                                    : "Send report"}
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.helpFooter}>
                {version && (
                    <p className={styles.versionLine}>
                        Nomi Downloader v{version}
                        {update?.outdated ? (
                            <a
                                className={styles.updateBadge}
                                href={STORE_URL}
                                target="_blank"
                                rel="noreferrer"
                                title={MANUAL_UPDATE_HINT}>
                                v{update.latest} available
                            </a>
                        ) : update ? (
                            <span className={styles.upToDate}>
                                ✓ Up to date
                            </span>
                        ) : null}
                    </p>
                )}
                <p>
                    Enjoying the extension?{" "}
                    <a
                        href="https://nomi.zar.mx/tip"
                        target="_blank"
                        rel="noreferrer">
                        Send a tip ♥
                    </a>
                </p>
            </div>
        </>
    );
};
