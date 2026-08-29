import { useRef, useState } from "react";
import { NomiApiClient } from "../../../../nomi/api";
import { buildLogsText, buildUserReportText } from "../../../../utils/report";
import { SITE_URL } from "../../../../utils/site";
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
    const [reportDiscord, setReportDiscord] = useState("");
    // The account email (from /me) links the report to this user so a reply
    // can reach the extension. Off = the report is send-and-forget.
    const [accountEmail, setAccountEmail] = useState("");
    const [includeEmail, setIncludeEmail] = useState(true);
    // Before sending, ask the user to double-check their contact info; the
    // first "Send" click flips this on, the second actually sends.
    const [confirming, setConfirming] = useState(false);
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
        setConfirming(false);
        if (reportOpen || emailFetched.current) return;
        emailFetched.current = true;
        // Prefill the name and reply-to email from the account; ignore
        // failures (e.g. not signed in) and leave the fields editable.
        new NomiApiClient()
            .getUserInfo()
            .then((me) => {
                setReportName((prev) => prev || me.profile.name);
                setReportEmail((prev) => prev || me.email);
                setAccountEmail(me.email);
            })
            .catch(() => {});
    }

    async function submitReport() {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        setSendState("sending");
        const text = await buildUserReportText(
            reportText,
            reportEmail,
            reportName,
            reportDiscord,
        );
        const ok = await sendReport(text, {
            accountEmail: includeEmail ? accountEmail : undefined,
            summary: reportText,
        });
        setSendState(ok ? "sent" : "failed");
        if (ok) {
            setTimeout(() => {
                setReportOpen(false);
                setReportText("");
                setSendState("idle");
                setConfirming(false);
            }, 1500);
        }
    }

    const email = reportEmail.trim();
    const discord = reportDiscord.trim();

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
                        onChange={(e) => {
                            setReportEmail(e.target.value);
                            setConfirming(false);
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Discord username (optional)"
                        value={reportDiscord}
                        onChange={(e) => {
                            setReportDiscord(e.target.value);
                            setConfirming(false);
                        }}
                    />
                    {accountEmail && (
                        <label className={styles.consentRow}>
                            <input
                                type="checkbox"
                                checked={includeEmail}
                                onChange={(e) => {
                                    setIncludeEmail(e.target.checked);
                                    setConfirming(false);
                                }}
                            />
                            <span>
                                Link this report to my account (
                                <strong>{accountEmail}</strong>) so the reply
                                can appear right here in the extension.
                            </span>
                        </label>
                    )}
                    {confirming && (
                        <p className={styles.confirmNote}>
                            {includeEmail && accountEmail ? (
                                <>
                                    The reply will appear here in the extension
                                    {email && (
                                        <>
                                            {" and by email at "}
                                            <strong>{email}</strong>
                                        </>
                                    )}
                                    {discord && (
                                        <>
                                            {" or on Discord as "}
                                            <strong>@{discord}</strong>
                                        </>
                                    )}
                                    . A typo in those means only the
                                    in-extension reply works.
                                </>
                            ) : email || discord ? (
                                <>
                                    Double-check your contact info — support
                                    will reach you
                                    {email && (
                                        <>
                                            {" at "}
                                            <strong>{email}</strong>
                                        </>
                                    )}
                                    {email && discord && " or"}
                                    {discord && (
                                        <>
                                            {" on Discord as "}
                                            <strong>@{discord}</strong>
                                        </>
                                    )}
                                    . A typo means no reply.
                                </>
                            ) : (
                                <>
                                    Without your account email, Discord or a
                                    reply address, it won't be possible to
                                    answer this report at all.
                                </>
                            )}
                        </p>
                    )}
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
                                    : confirming
                                      ? "Confirm & send"
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
                        href={`${SITE_URL}/tip`}
                        target="_blank"
                        rel="noreferrer">
                        Send a tip ♥
                    </a>
                </p>
            </div>
        </>
    );
};
