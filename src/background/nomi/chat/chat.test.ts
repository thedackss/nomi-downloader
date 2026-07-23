import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
    ChatMessage,
    renderChatDocument,
    renderChatPayload,
} from "./ChatDocument";
import css from "./chat.scss?inline";

describe("chat styling", () => {
    it("inlines the chat CSS with the classes the markup uses", () => {
        expect(css).toContain(".row");
        expect(css).toContain(".bubble");
        expect(css).toContain(".nomi");
    });
});

describe("renderChatDocument", () => {
    const html = renderChatDocument({
        name: "Veronica",
        avatar: "data:image/webp;base64,AAAA",
        children: createElement(ChatMessage, {
            isNomi: true,
            text: "hello there",
            date: new Date("2026-02-19T14:05:00"),
        }),
    });

    it("produces a self-contained document", () => {
        expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
        expect(html).toContain("<style>");
        expect(html).toContain("</html>");
    });

    it("renders the header with the Nomi name and avatar", () => {
        expect(html).toContain('class="chat-header"');
        expect(html).toContain("Veronica");
        expect(html).toContain('src="data:image/webp;base64,AAAA"');
    });

    it("plays the profile video in the header, with the still as poster", () => {
        const withVideo = renderChatDocument({
            name: "Veronica",
            avatar: "data:image/webp;base64,AAAA",
            avatarVideo: "data:video/mp4;base64,BBBB",
            children: createElement(ChatMessage, {
                isNomi: true,
                text: "hi",
                date: new Date("2026-02-19T14:05:00"),
            }),
        });
        expect(withVideo).toContain("<video");
        expect(withVideo).toContain('src="data:video/mp4;base64,BBBB"');
        expect(withVideo).toContain('poster="data:image/webp;base64,AAAA"');
        // The still is the video's poster, not a separate header <img>.
        expect(withVideo).not.toContain('<img class="avatar"');
    });

    it("renders the message text inside a nomi row bubble", () => {
        expect(html).toContain("hello there");
        expect(html).toContain('class="row nomi"');
        expect(html).toContain('class="bubble"');
    });

    it("renders a sender name label above the bubble when provided", () => {
        const group = renderChatDocument({
            name: "My Group",
            children: createElement(ChatMessage, {
                isNomi: true,
                text: "hi all",
                date: new Date("2026-02-19T14:05:00"),
                name: "Mya",
            }),
        });
        expect(group).toContain('class="name"');
        expect(group).toContain("Mya");
    });

    it("omits the name label when no name is given", () => {
        expect(html).not.toContain('class="name"');
    });

    it("escapes message text (no raw HTML injection)", () => {
        const evil = renderChatDocument({
            name: "Veronica",
            children: createElement(ChatMessage, {
                isNomi: false,
                text: "<script>alert(1)</script>",
                date: new Date("2026-02-19T14:05:00"),
            }),
        });
        expect(evil).not.toContain("<script>alert(1)</script>");
        expect(evil).toContain("&lt;script&gt;");
    });
});

describe("renderChatPayload", () => {
    it("renders a serializable payload (the offscreen entry point)", () => {
        const html = renderChatPayload({
            name: "Veronica",
            avatar: "data:image/webp;base64,AAAA",
            items: [
                {
                    kind: "message",
                    isNomi: false,
                    text: "hi",
                    sent: "2026-02-19T14:00:00",
                },
                { kind: "selfie", src: "data:image/webp;base64,BBBB" },
                { kind: "failed" },
            ],
        });

        expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
        expect(html).toContain("Veronica");
        expect(html).toContain("hi");
        expect(html).toContain('class="selfie"');
        expect(html).toContain("Image unavailable");
        // No info card markup unless one is supplied (the CSS always defines
        // the class, so check for the rendered element specifically).
        expect(html).not.toContain('class="info-card"');
    });

    it("marks voice messages and renders a player when audio is exported", () => {
        const html = renderChatPayload({
            name: "Veronica",
            items: [
                {
                    kind: "message",
                    isNomi: true,
                    text: "spoken reply",
                    sent: "2026-07-23T01:03:05Z",
                    isVoice: true,
                    audioSrc: "voice/voice_1_2026-07-23.flac",
                },
                {
                    kind: "message",
                    isNomi: false,
                    text: "spoken but no audio export",
                    sent: "2026-07-23T01:04:00Z",
                    isVoice: true,
                },
            ],
        });

        expect(html).toContain("🎙 Voice message");
        expect(html).toContain('src="voice/voice_1_2026-07-23.flac"');
        // The second message is flagged but has no player.
        expect(html.match(/🎙 Voice message/g)).toHaveLength(2);
        expect(html.match(/<audio/g)).toHaveLength(1);
    });

    it("renders a voice call section with its transcript", () => {
        const html = renderChatPayload({
            name: "Veronica",
            items: [
                {
                    kind: "voiceCall",
                    started: "2026-07-23T00:58:05Z",
                    ended: "2026-07-23T01:00:35Z",
                    messages: [
                        {
                            isNomi: false,
                            text: "Hello?",
                            created: "2026-07-23T00:58:09Z",
                        },
                        {
                            isNomi: true,
                            text: "Finally, you called.",
                            created: "2026-07-23T00:58:49Z",
                        },
                    ],
                },
            ],
        });

        expect(html).toContain('class="voice-call"');
        expect(html).toContain("📞 Voice call");
        expect(html).toContain("· 2:30"); // duration from started→ended
        expect(html).toContain("Finally, you called.");
        expect(html).toContain('class="call-line nomi"');
        expect(html).toContain('class="call-line user"');
    });

    it("renders an empty-transcript note when a call has no lines", () => {
        const html = renderChatPayload({
            name: "Veronica",
            items: [
                {
                    kind: "voiceCall",
                    started: "2026-07-23T00:58:05Z",
                    messages: [],
                },
            ],
        });

        expect(html).toContain("No transcript available");
    });

    it("renders an info card at the top when info rows are given", () => {
        const html = renderChatPayload({
            name: "My Group",
            info: [
                { label: "Type", value: "group" },
                { label: "Members", value: "Mya, Lexi" },
            ],
            items: [
                {
                    kind: "message",
                    isNomi: true,
                    text: "hi all",
                    sent: "2026-02-19T14:00:00",
                    name: "Mya",
                },
            ],
        });

        expect(html).toContain('class="info-card"');
        expect(html).toContain("Members");
        expect(html).toContain("Mya, Lexi");
        // The info card precedes the first message.
        expect(html.indexOf("info-card")).toBeLessThan(html.indexOf("hi all"));
    });
});
