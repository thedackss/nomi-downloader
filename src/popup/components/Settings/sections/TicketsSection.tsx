import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildLogsText } from "../../../../utils/report";
import { type DevReply, useReplies } from "../../../hooks/useReplies";
import {
    type FollowUpError,
    getTickets,
    sendFollowUp,
    type Ticket,
} from "../../../report/sendReport";
import styles from "../styles.module.scss";

/**
 * Fit text into a follow-up message: when too long, keep the head (the report
 * header with platform/version) and the tail (the newest log lines, which
 * carry the failure), dropping the middle.
 */
function fitFollowUp(text: string, max: number): string {
    if (text.length <= max) return text;
    const head = 240;
    const sep = "\n…(older lines trimmed)…\n";
    const tail = max - head - sep.length;
    return text.slice(0, head) + sep + text.slice(-tail);
}

/** Server-side cap on a follow-up message (FollowUpDto). */
const MAX_LENGTH = 2000;

const STATUS_LABEL: Record<string, string> = {
    open: "Sent",
    replied: "Replied",
    resolved: "Resolved",
};

interface ThreadMessage {
    key: string;
    author: "user" | "dev";
    text: string;
    created: string;
}

/**
 * The user's bug reports as compact chips; clicking one opens a modal with
 * the full conversation (chat style), the exact report text that was sent
 * (expandable), and a box to send a follow-up message. Viewing this section
 * marks replies seen, which clears the popup banner.
 */
export const TicketsSection = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
    const { replies, statuses, unseen, markSeen, append } = useReplies();

    useEffect(() => {
        getTickets().then((list) => setTickets(list.reverse()));
    }, []);

    useEffect(() => {
        if (unseen > 0) markSeen();
    }, [unseen, markSeen]);

    if (tickets.length === 0) {
        return (
            <p className={styles.helpIntro}>
                No reports yet. When you send a bug report (from the Help
                section), it appears here along with any developer replies.
            </p>
        );
    }

    return (
        <>
            <p className={styles.helpIntro}>
                Your bug reports. Open one to read the conversation or send a
                follow-up — replies arrive right here, no email needed.
            </p>
            <div className={styles.tickets}>
                {tickets.map((t) => {
                    const status = statuses[t.id] ?? "open";
                    const count = replies.filter(
                        (r) => r.reportId === t.id,
                    ).length;
                    return (
                        <button
                            type="button"
                            key={t.id}
                            className={styles.ticketChip}
                            onClick={() => setOpenTicket(t)}>
                            <span
                                className={`${styles.ticketStatus} ${styles[`status_${status}`] ?? ""}`}>
                                {STATUS_LABEL[status] ?? status}
                            </span>
                            <span className={styles.ticketChipText}>
                                {t.summary || "(no description)"}
                            </span>
                            <span className={styles.ticketDate}>
                                {count > 0 && (
                                    <span className={styles.ticketCount}>
                                        {count}
                                    </span>
                                )}
                                {new Date(t.created).toLocaleDateString()}
                            </span>
                        </button>
                    );
                })}
            </div>
            {openTicket && (
                <TicketModal
                    ticket={openTicket}
                    status={statuses[openTicket.id] ?? "open"}
                    replies={replies.filter(
                        (r) => r.reportId === openTicket.id,
                    )}
                    onSent={append}
                    onClose={() => setOpenTicket(null)}
                />
            )}
        </>
    );
};

const TicketModal = ({
    ticket,
    status,
    replies,
    onSent,
    onClose,
}: {
    ticket: Ticket;
    status: string;
    replies: DevReply[];
    onSent: (reply: DevReply) => void;
    onClose: () => void;
}) => {
    const [draft, setDraft] = useState("");
    const [sendState, setSendState] = useState<"idle" | "sending">("idle");
    const [sendError, setSendError] = useState<FollowUpError | null>(null);
    const threadRef = useRef<HTMLDivElement>(null);

    const thread: ThreadMessage[] = [
        {
            key: "original",
            author: "user",
            text: ticket.summary || "(no description)",
            created: ticket.created,
        },
        ...replies.map((r) => ({
            key: r.id,
            author: r.author,
            text: r.text,
            created: r.created,
        })),
    ];

    function echo(text: string) {
        // Echo through the shared store so the message survives closing and
        // reopening the modal within this popup session.
        onSent({
            id: `local-${crypto.randomUUID()}`,
            reportId: ticket.id,
            text,
            created: new Date().toISOString(),
            author: "user",
        });
    }

    async function submit() {
        const text = draft.trim();
        if (!text) return;
        setSendState("sending");
        setSendError(null);
        const { ok, error } = await sendFollowUp(ticket.id, text);
        setSendState("idle");
        if (ok) {
            echo(text);
            setDraft("");
        } else {
            setSendError(error ?? "error");
        }
    }

    // Attach the extension's recent logs to this ticket, so the developer can
    // see what happened without the user having to file a whole new report.
    async function sendLogs() {
        setSendState("sending");
        setSendError(null);
        const logs = fitFollowUp(await buildLogsText(), MAX_LENGTH);
        const { ok, error } = await sendFollowUp(ticket.id, logs);
        setSendState("idle");
        if (ok) echo(logs);
        else setSendError(error ?? "error");
    }

    // Chat convention: open at the newest message (any unread developer
    // replies are at the bottom), and follow along as messages are added.
    // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on thread growth
    useEffect(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
    }, [thread.length]);

    // Portaled to <body>: the settings page keeps a transform from its
    // slide-in animation, which would turn position: fixed into
    // position-relative-to-the-page and clip the backdrop to the content pane.
    return createPortal(
        <div
            className={styles.ticketOverlay}
            role="presentation"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}>
            <div
                className={styles.ticketModal}
                role="dialog"
                aria-label="Report conversation">
                <header>
                    <span
                        className={`${styles.ticketStatus} ${styles[`status_${status}`] ?? ""}`}>
                        {STATUS_LABEL[status] ?? status}
                    </span>
                    <span className={styles.ticketDate}>
                        {new Date(ticket.created).toLocaleDateString()}
                    </span>
                    <button
                        type="button"
                        aria-label="Close"
                        className={styles.ticketClose}
                        onClick={onClose}>
                        ✕
                    </button>
                </header>

                <div className={styles.ticketThread} ref={threadRef}>
                    {thread.map((m) => (
                        <div
                            key={m.key}
                            className={`${styles.bubble} ${
                                m.author === "user"
                                    ? styles.fromUser
                                    : styles.fromDev
                            }`}>
                            <p>{m.text}</p>
                            <span>
                                {m.author === "dev" && "Developer · "}
                                {new Date(m.created).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>

                {ticket.info && (
                    <details className={styles.ticketLogs}>
                        <summary>What was sent (report + logs)</summary>
                        <pre>{ticket.info}</pre>
                    </details>
                )}

                {(sendError || draft.length >= MAX_LENGTH - 200) && (
                    <p className={styles.sendNote}>
                        {sendError === "too_long"
                            ? "That message is too long — the limit is 2,000 characters."
                            : sendError === "rate_limited"
                              ? "Too many messages at once — wait a minute and try again."
                              : sendError === "error"
                                ? "Couldn't send — check your connection and try again."
                                : `${draft.length.toLocaleString()} / ${MAX_LENGTH.toLocaleString()}`}
                    </p>
                )}
                <div className={styles.ticketReplyBox}>
                    <textarea
                        rows={2}
                        maxLength={MAX_LENGTH}
                        placeholder="Add more details, or ask about the status…"
                        value={draft}
                        onChange={(e) => {
                            setDraft(e.target.value);
                            setSendError(null);
                        }}
                    />
                    <button
                        type="button"
                        disabled={!draft.trim() || sendState === "sending"}
                        onClick={submit}>
                        {sendState === "sending"
                            ? "Sending…"
                            : sendError
                              ? "Retry"
                              : "Send"}
                    </button>
                </div>
                <button
                    type="button"
                    className={styles.attachLogs}
                    disabled={sendState === "sending"}
                    onClick={sendLogs}>
                    Attach recent logs
                </button>
            </div>
        </div>,
        document.body,
    );
};
