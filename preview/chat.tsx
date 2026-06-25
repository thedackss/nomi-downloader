/*
 * Live preview of the exported chat HTML.
 *
 * Run `npm run preview:chat` and open the printed localhost URL. Editing the
 * chat design (src/background/nomi/chat/ChatDocument.tsx or chat.module.scss)
 * hot-reloads this preview, so you can iterate on the look without building
 * the extension.
 *
 * The sample log below is fake data — tweak it to exercise edge cases.
 */
import {
    ChatMessage,
    ChatSelfie,
    renderChatDocument,
} from "../src/background/nomi/chat/ChatDocument";

const base = new Date("2026-02-19T14:00:00");
const at = (minutes: number) => new Date(base.getTime() + minutes * 60_000);

// A purple placeholder so the preview works offline (no real selfie fetch).
const placeholderSelfie =
    "https://media.discordapp.net/attachments/1399432707787849879/1399432722413256776/ive-been-dreaming-of-a-white-christmas-v0-8isp1ks99c9e1.png?ex=6a3d5b49&is=6a3c09c9&hm=d1cbf43ab49bd2905954cd8790553f4ded6b2c9b77d870a4ddeab7bd26aa7f0f&=&format=webp&quality=lossless";

const sample = (
    <>
        <ChatMessage
            isNomi={false}
            text="Hey! How was your day?"
            date={at(0)}
        />
        <ChatMessage
            isNomi
            text="It was wonderful, thank you for asking 💜 I spent the afternoon reading."
            date={at(1)}
        />
        <ChatMessage
            isNomi={false}
            text="Can you send me a selfie?"
            date={at(2)}
        />
        <ChatSelfie src={placeholderSelfie} />
        <ChatSelfie src={placeholderSelfie} />
        <ChatMessage isNomi text="Here you go! Two of them ☺️" date={at(3)} />
        <ChatMessage
            isNomi={false}
            text={
                "These look amazing.\nThis line break tests multi-line wrapping, and here is a much longer sentence to make sure long messages wrap nicely inside the bubble without overflowing the layout."
            }
            date={at(4)}
        />
    </>
);

const frame = document.getElementById("preview") as HTMLIFrameElement | null;
if (frame) {
    frame.srcdoc = renderChatDocument({
        name: "Veronica",
        avatar: placeholderSelfie,
        children: (
            <>
                {sample}
                {sample}
            </>
        ),
    });
}
