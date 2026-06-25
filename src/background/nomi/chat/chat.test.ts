import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { ChatMessage, renderChatDocument } from "./ChatDocument";
import css from "./chat.scss?inline";

describe("chat styling", () => {
    it("inlines the chat CSS with the classes the markup uses", () => {
        expect(css).toContain(".msg");
        expect(css).toContain(".nomi");
        expect(css).toContain(".detail");
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

    it("renders the message text with its bubble class", () => {
        expect(html).toContain("hello there");
        expect(html).toContain('class="msg nomi"');
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
