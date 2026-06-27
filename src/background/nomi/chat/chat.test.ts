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
    });
});
