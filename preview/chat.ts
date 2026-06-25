/*
 * Live preview of the exported chat HTML.
 *
 * Run `npm run preview:chat` and open the printed localhost URL. Editing
 * the chat design (src/background/nomi/chatTemplate.ts) or the markup
 * helpers (src/background/nomi/chatHtml.ts) hot-reloads this preview, so
 * you can iterate on the look without building the extension.
 *
 * The sample log below is fake data — tweak it to exercise edge cases
 * (long messages, many selfies, etc.).
 */
import {
    buildChatDocument,
    renderChatMessage,
    renderChatSelfie,
} from "../src/background/nomi/chatHtml";

const base = new Date("2026-02-19T14:00:00");
const at = (minutes: number) => new Date(base.getTime() + minutes * 60_000);

// A purple placeholder so the preview works offline (no real selfie fetch).
const placeholderSelfie =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect width='100%25' height='100%25' fill='%239610ff'/%3E%3Ctext x='50%25' y='50%25' fill='white' font-family='sans-serif' font-size='20' text-anchor='middle' dominant-baseline='middle'%3Eselfie%3C/text%3E%3C/svg%3E";

function sampleBody(): string {
    let html = "";
    html += renderChatMessage(false, "Hey! How was your day?", at(0));
    html += renderChatMessage(
        true,
        "It was wonderful, thank you for asking 💜 I spent the afternoon reading.",
        at(1),
    );
    html += renderChatMessage(false, "Can you send me a selfie?", at(2));
    html += renderChatSelfie(placeholderSelfie);
    html += renderChatSelfie(placeholderSelfie);
    html += renderChatMessage(true, "Here you go! Two of them ☺️", at(3));
    html += renderChatMessage(
        false,
        "These look amazing.\nThis line break tests multi-line wrapping, and here is a much longer sentence to make sure long messages wrap nicely inside the bubble without overflowing the layout.",
        at(4),
    );
    return html;
}

function render(): void {
    const frame = document.getElementById(
        "preview",
    ) as HTMLIFrameElement | null;
    if (frame) frame.srcdoc = buildChatDocument(sampleBody());
}

render();
