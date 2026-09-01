import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import css from "./chat.scss?inline";
import type { ChatInfoRow, ChatRenderPayload, VoiceCallLine } from "./types";

/*
 * The exported chat HTML, authored as a component so the design can be
 * edited like normal React/SCSS instead of a giant template string.
 *
 * It renders to a self-contained static HTML string (renderChatDocument)
 * with the compiled SCSS inlined, so the downloaded file needs no runtime.
 *
 * Styles use plain (non-module) class names: the export is a whole standalone
 * document, so there is nothing to scope against — and CSS-module hashing
 * would not match the inlined CSS anyway. Keep class names here in sync with
 * chat.scss.
 *
 * Live-edit with: npm run preview:chat
 */

// Click any selfie to open it full-screen in a new tab. Delegated from the
// list so no inline handlers are needed on each <img>.
const SCRIPT = `
function openImage(src){
    var tab = window.open();
    tab.document.write('<body style="background:#000;margin:0;display:flex;justify-content:center;align-items:center;height:100vh;width:100vw"><img src="'+src+'" style="max-width:100%;max-height:100%" /></body>');
}
document.getElementById('messages').addEventListener('click', function(e){
    if (e.target && e.target.tagName === 'IMG') openImage(e.target.src);
});
`;

function pad(n: number): string {
    return n.toString().padStart(2, "0");
}

interface ChatMessageProps {
    isNomi: boolean;
    text: string;
    date: Date;
    /** Speaker label shown above the bubble (group chats with many Nomis). */
    name?: string;
    /** Mark the bubble as a spoken (voice) message. */
    isVoice?: boolean;
    /** Relative path to the message's audio; renders an inline player. */
    audioSrc?: string;
}

/** A chat message: a bubble with its timestamp grouped in a row. */
export function ChatMessage({
    isNomi,
    text,
    date,
    name,
    isVoice,
    audioSrc,
}: ChatMessageProps) {
    const who = isNomi ? "nomi" : "user";
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    return (
        <li className={`row ${who}`}>
            {name ? <span className="name">{name}</span> : null}
            {isVoice ? (
                <span className="voice-tag">🎙 Voice message</span>
            ) : null}
            <div className="bubble">{text}</div>
            {audioSrc ? (
                // biome-ignore lint/a11y/useMediaCaption: the spoken text is rendered as the bubble right above the player
                <audio
                    className="voice-audio"
                    controls
                    preload="none"
                    src={audioSrc}
                />
            ) : null}
            <span className="time">
                {date.toDateString()} · {time}
            </span>
        </li>
    );
}

/** A selfie image, rendered as a media row. `src` may be a data URI or URL. */
export function ChatSelfie({ src }: { src: string }) {
    return (
        <li className="row nomi">
            <img className="selfie" src={src} alt="selfie" />
        </li>
    );
}

/** Placeholder shown when a selfie image could not be fetched. */
export function ChatImageFailed() {
    return (
        <li className="row nomi">
            <div className="bubble failed">Image unavailable</div>
        </li>
    );
}

interface ChatVoiceCallProps {
    started: Date;
    ended?: Date;
    messages: VoiceCallLine[];
}

/** A voice call: a labeled section with its transcript lines. */
export function ChatVoiceCall({
    started,
    ended,
    messages,
}: ChatVoiceCallProps) {
    const time = `${pad(started.getHours())}:${pad(started.getMinutes())}`;
    let duration: string | null = null;
    if (ended) {
        const secs = Math.max(
            0,
            Math.round((ended.getTime() - started.getTime()) / 1000),
        );
        duration = `${Math.floor(secs / 60)}:${pad(secs % 60)}`;
    }

    return (
        <li className="voice-call">
            <div className="call-header">
                <span className="call-title">📞 Voice call</span>
                <span className="call-meta">
                    {started.toDateString()} · {time}
                    {duration ? ` · ${duration}` : ""}
                </span>
            </div>
            {messages.length > 0 ? (
                <ul className="call-lines">
                    {messages.map((line) => (
                        <li
                            key={line.created + (line.text ?? "").slice(0, 16)}
                            className={`call-line ${line.isNomi ? "nomi" : "user"}`}>
                            {line.text}
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="call-empty">No transcript available</div>
            )}
        </li>
    );
}

/** Info card of labeled facts shown above the messages (group chats). */
export function ChatInfo({ rows }: { rows: ChatInfoRow[] }) {
    if (rows.length === 0) return null;
    return (
        <li className="info-card">
            {rows.map((row) => (
                <div className="info-row" key={row.label}>
                    <span className="info-label">{row.label}</span>
                    <span className="info-value">{row.value}</span>
                </div>
            ))}
        </li>
    );
}

interface ChatDocumentProps {
    /** Nomi name shown in the header and document title. */
    name: string;
    /** Avatar image as a data URI; omitted if it couldn't be fetched. */
    avatar?: string;
    /** Profile video as a data URI; played in the header when present. */
    avatarVideo?: string;
    children: ReactNode;
}

function ChatDocument({
    name,
    avatar,
    avatarVideo,
    children,
}: ChatDocumentProps) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>{`${name} — Nomi chat`}</title>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inlining the compiled SCSS so the export is self-contained */}
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </head>
            <body>
                <header className="chat-header">
                    {avatarVideo ? (
                        <video
                            className="avatar"
                            src={avatarVideo}
                            poster={avatar}
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : avatar ? (
                        <img className="avatar" src={avatar} alt={name} />
                    ) : null}
                    <h1>{name}</h1>
                </header>
                <ul id="messages">{children}</ul>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static click-to-zoom helper, no user input */}
                <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
            </body>
        </html>
    );
}

/** Render the full standalone chat HTML document to a string. */
export function renderChatDocument(props: ChatDocumentProps): string {
    return `<!DOCTYPE html>${renderToStaticMarkup(<ChatDocument {...props} />)}`;
}

/**
 * Render a serializable payload (built in the worker) to the chat HTML string.
 * This is the entry point used by the offscreen document.
 */
export function renderChatPayload(payload: ChatRenderPayload): string {
    const children: ReactNode[] = [];

    if (payload.info?.length) {
        children.push(
            createElement(ChatInfo, { key: "info", rows: payload.info }),
        );
    }

    for (let i = 0; i < payload.items.length; i++) {
        const item = payload.items[i];
        if (item.kind === "message") {
            children.push(
                createElement(ChatMessage, {
                    key: i,
                    isNomi: item.isNomi,
                    text: item.text,
                    date: new Date(item.sent),
                    name: item.name,
                    isVoice: item.isVoice,
                    audioSrc: item.audioSrc,
                }),
            );
        } else if (item.kind === "selfie") {
            children.push(createElement(ChatSelfie, { key: i, src: item.src }));
        } else if (item.kind === "voiceCall") {
            children.push(
                createElement(ChatVoiceCall, {
                    key: i,
                    started: new Date(item.started),
                    ended: item.ended ? new Date(item.ended) : undefined,
                    messages: item.messages,
                }),
            );
        } else {
            children.push(createElement(ChatImageFailed, { key: i }));
        }
    }

    return renderChatDocument({
        name: payload.name,
        avatar: payload.avatar,
        avatarVideo: payload.avatarVideo,
        children,
    });
}
