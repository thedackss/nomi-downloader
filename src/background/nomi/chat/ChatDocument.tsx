import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import css from "./chat.scss?inline";

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
}

/** A chat message: the bubble plus its timestamp line. */
export function ChatMessage({ isNomi, text, date }: ChatMessageProps) {
    const who = isNomi ? "nomi" : "user";
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    return (
        <>
            <li className={`msg ${who}`}>{text}</li>
            <li className={`detail ${who}`}>
                {date.toDateString()} {time}
            </li>
        </>
    );
}

/** A selfie image bubble. `src` may be a data URI or a URL. */
export function ChatSelfie({ src }: { src: string }) {
    return <img src={src} alt="selfie" />;
}

/** Placeholder shown when a selfie image could not be fetched. */
export function ChatImageFailed() {
    return <li className="msg result">[Image Download Failed]</li>;
}

interface ChatDocumentProps {
    /** Nomi name shown in the header and document title. */
    name: string;
    /** Avatar image as a data URI; omitted if it couldn't be fetched. */
    avatar?: string;
    children: ReactNode;
}

function ChatDocument({ name, avatar, children }: ChatDocumentProps) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>{name} — Nomi chat</title>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inlining the compiled SCSS so the export is self-contained */}
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </head>
            <body>
                <header className="chat-header">
                    {avatar ? (
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
