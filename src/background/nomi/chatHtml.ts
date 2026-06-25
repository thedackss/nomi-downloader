import { ChatTemplate } from "./chatTemplate";

/*
 * Pure markup helpers for the exported chat HTML, shared by the downloader
 * and the design preview.
 *
 * To live-edit the chat design: `npm run preview:chat` opens a hot-reloading
 * preview of a sample chat log. Edit the styles/structure in chatTemplate.ts
 * (or these helpers) and the preview updates on save.
 */

/** Wrap rendered message markup in the full standalone chat HTML document. */
export function buildChatDocument(messagesHtml: string): string {
    return ChatTemplate.replace("{messages}", messagesHtml);
}

/** One chat message: the bubble plus its timestamp line. */
export function renderChatMessage(
    isNomi: boolean,
    text: string,
    date: Date,
): string {
    const className = isNomi ? "nomi" : "user";
    const day = date.toDateString();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const time = `${hours}:${minutes}`;

    return `<li class='msg ${className}'>${text}</li><li class='detail ${className}'>${day} ${time}</li>`;
}

/** A selfie image bubble. `src` may be a data URI or a URL. */
export function renderChatSelfie(src: string): string {
    return `<img onclick="openImage(this.src)" src='${src}' />`;
}

/** Placeholder shown when a selfie image could not be fetched. */
export const CHAT_IMAGE_FAILED = `<li class='msg result'>[Image Download Failed]</li>`;
