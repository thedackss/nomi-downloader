import { describe, expect, it } from "vitest";
import type { ApiAnchorLooksResponse } from "../../../nomi/types/api.nomis.id.anchorLooks";
import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import { buildAnchorRefs, buildImageNotes, buildSharedNotes } from "./builder";
import { renderSharedNotesDocument } from "./SharedNotesDocument";
import css from "./sharednotes.scss?inline";
import type { SharedNotesRenderPayload } from "./types";

const emptyResponse: ApiSharedNotesResponse = {
    nomiId: 1,
    backstory: null,
    roleplay: null,
    preferences: null,
    boundaries: null,
    nicknames: null,
    desires: null,
    userAppearance: null,
    nomiChatAppearance: null,
    nomiAppearance: null,
    v4NomiAppearance: null,
    selfieTendencies: null,
    communicationStyle: null,
    updated: "2026-06-25T00:00:00.000Z",
};

const emptyPayload: Omit<SharedNotesRenderPayload, "notes"> = {
    name: "Yuki",
    generatedAt: "2026-06-25T00:00:00.000Z",
    anchors: [],
    imageNotes: [],
};

describe("buildSharedNotes", () => {
    it("maps fields to titles and drops empty/whitespace notes, in UI order", () => {
        const notes = buildSharedNotes("Yuki", {
            ...emptyResponse,
            backstory: "Met two winters ago.",
            communicationStyle: "Warm and playful.",
            roleplay: "   ", // whitespace only -> dropped
            nomiChatAppearance: "Auburn hair.",
        });
        expect(notes.map((n) => n.title)).toEqual([
            "Backstory",
            "Inclination",
            "Yuki's Chat Appearance",
        ]);
        expect(notes[1].content).toBe("Warm and playful.");
    });

    it("returns no notes when everything is blank", () => {
        expect(buildSharedNotes("Yuki", emptyResponse)).toEqual([]);
    });
});

describe("buildImageNotes", () => {
    it("maps the image-settings text sections in order", () => {
        const notes = buildImageNotes("Aria", {
            ...emptyResponse,
            selfieTendencies: "Natural light.",
            v4NomiAppearance: "V4 look.",
            nomiAppearance: "V3 look.",
        });
        expect(notes.map((n) => n.title)).toEqual([
            "Appearance Tendencies (global)",
            "Aria's Appearance V4",
            "Aria's Appearance V3",
        ]);
    });
});

describe("buildAnchorRefs", () => {
    const looks: ApiAnchorLooksResponse = {
        nomiAnchorLooks: [
            {
                uuid: "anchor-1",
                nomiId: 42,
                fidelity: 0.4,
                appearanceTraits: "  Trendy  ",
                type: "User",
                userAnchorLook: { uuid: "u1", previewHash: "hash1" },
            },
            {
                uuid: "anchor-2",
                nomiId: 42,
                fidelity: 1,
                appearanceTraits: null,
                type: "User",
                userAnchorLook: null,
            },
        ],
    };

    it("builds the preview image URL and trims traits", () => {
        const refs = buildAnchorRefs(42, looks);
        expect(refs[0].imageUrl).toBe(
            "nomis/42/anchor-looks/anchor-1/previews/hash1.webp",
        );
        expect(refs[0].appearanceTraits).toBe("Trendy");
        // No previewHash -> no image URL.
        expect(refs[1].imageUrl).toBeUndefined();
        expect(refs[1].appearanceTraits).toBe("");
    });
});

describe("shared notes styling", () => {
    it("inlines the CSS with the classes the markup uses", () => {
        expect(css).toContain(".note");
        expect(css).toContain(".note-head");
        expect(css).toContain(".anchors");
        expect(css).toContain(".anchor-img");
    });
});

describe("renderSharedNotesDocument", () => {
    const html = renderSharedNotesDocument({
        ...emptyPayload,
        avatar: "data:image/webp;base64,AAAA",
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
        expect(html).toContain("Sol, love");
    });

    it("renders the anchor gallery and image-settings group", () => {
        const withImages = renderSharedNotesDocument({
            ...emptyPayload,
            notes: [],
            anchors: [
                {
                    image: "data:image/webp;base64,BBBB",
                    fidelity: 0.4,
                    appearanceTraits: "Trendy modern look.",
                },
            ],
            imageNotes: [
                { title: "Appearance Tendencies (global)", content: "Natural" },
            ],
        });
        expect(withImages).toContain("Image Settings");
        expect(withImages).toContain("Anchors"); // "Yuki&#x27;s Anchors"
        expect(withImages).toContain('src="data:image/webp;base64,BBBB"');
        expect(withImages).toContain("40%"); // fidelity
        expect(withImages).toContain("Trendy modern look.");
    });

    it("escapes note content (no raw HTML injection)", () => {
        const evil = renderSharedNotesDocument({
            ...emptyPayload,
            notes: [
                { title: "Backstory", content: "<script>alert(1)</script>" },
            ],
        });
        expect(evil).not.toContain("<script>alert(1)</script>");
        expect(evil).toContain("&lt;script&gt;");
    });
});
