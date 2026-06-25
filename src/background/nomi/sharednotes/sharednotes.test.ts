import { describe, expect, it } from "vitest";
import { renderSharedNotesDocument } from "./SharedNotesDocument";
import css from "./sharednotes.scss?inline";

describe("shared notes styling", () => {
    it("inlines the CSS with the classes the markup uses", () => {
        expect(css).toContain(".note");
        expect(css).toContain(".note-head");
        expect(css).toContain(".notes-header");
    });
});

describe("renderSharedNotesDocument", () => {
    const html = renderSharedNotesDocument({
        name: "Yuki",
        avatar: "data:image/webp;base64,AAAA",
        generatedAt: "2026-06-25T00:00:00.000Z",
        notes: [
            {
                title: "Backstory",
                description: "Core details to prioritize.",
                content: "We met two winters ago.\nShe runs a studio.",
            },
            { title: "Nicknames", content: "Sol, love" },
        ],
    });

    it("produces a self-contained document", () => {
        expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
        expect(html).toContain("<style>");
        expect(html).toContain("</html>");
    });

    it("renders the header with the Nomi name and avatar", () => {
        expect(html).toContain("Yuki — Shared Notes");
        expect(html).toContain('src="data:image/webp;base64,AAAA"');
    });

    it("renders each note's title and content", () => {
        expect(html).toContain("Backstory");
        expect(html).toContain("We met two winters ago.");
        expect(html).toContain("Nicknames");
        expect(html).toContain("Sol, love");
    });

    it("omits the description paragraph when a note has none", () => {
        // The Nicknames note has no description; its content still renders.
        expect(html).toContain("Core details to prioritize.");
    });

    it("escapes note content (no raw HTML injection)", () => {
        const evil = renderSharedNotesDocument({
            name: "Yuki",
            generatedAt: "2026-06-25T00:00:00.000Z",
            notes: [
                { title: "Backstory", content: "<script>alert(1)</script>" },
            ],
        });
        expect(evil).not.toContain("<script>alert(1)</script>");
        expect(evil).toContain("&lt;script&gt;");
    });
});
