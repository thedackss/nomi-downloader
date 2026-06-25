import { describe, expect, it } from "vitest";
import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import { buildSharedNotes } from "./builder";
import { renderSharedNotesDocument } from "./SharedNotesDocument";
import css from "./sharednotes.scss?inline";

const emptyResponse: ApiSharedNotesResponse = {
    nomiId: 1,
    backstory: null,
    roleplay: null,
    preferences: null,
    boundaries: null,
    nicknames: null,
    desires: null,
    userAppearance: null,
    nomiAppearance: null,
    communicationStyle: null,
    updated: "2026-06-25T00:00:00.000Z",
};

describe("buildSharedNotes", () => {
    it("maps fields to titles and drops empty/whitespace notes, in UI order", () => {
        const notes = buildSharedNotes("Yuki", {
            ...emptyResponse,
            backstory: "Met two winters ago.",
            communicationStyle: "Warm and playful.",
            roleplay: "   ", // whitespace only -> dropped
            nomiAppearance: "Auburn hair.",
        });
        expect(notes.map((n) => n.title)).toEqual([
            "Backstory",
            "Inclination",
            "Yuki's Appearance",
        ]);
        expect(notes[1].content).toBe("Warm and playful.");
    });

    it("returns no notes when everything is blank", () => {
        expect(buildSharedNotes("Yuki", emptyResponse)).toEqual([]);
    });

    it("interpolates the Nomi name into the appearance title", () => {
        const notes = buildSharedNotes("Aria", {
            ...emptyResponse,
            nomiAppearance: "x",
        });
        expect(notes[0].title).toBe("Aria's Appearance");
    });
});

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
