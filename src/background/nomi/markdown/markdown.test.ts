import { describe, expect, it } from "vitest";
import type { ApiNomisIdResponse } from "../../../nomi/types/api.nomis.id";
import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import type { NomiJsonInput } from "../json/builder";
import { buildNomiMarkdown } from "./builder";

const shared = {
    nomiId: 1,
    backstory: "We met in winter.",
    roleplay: null,
    preferences: null,
    boundaries: null,
    nicknames: null,
    desires: null,
    userAppearance: null,
    nomiChatAppearance: "Auburn hair.",
    nomiAppearance: null,
    v4NomiAppearance: null,
    selfieTendencies: null,
    communicationStyle: "Warm and playful.",
    updated: "2026-06-25T00:00:00.000Z",
} satisfies ApiSharedNotesResponse;

const input: NomiJsonInput = {
    nomiId: 1,
    nomi: {
        id: 1,
        name: "Yuki",
        created: "2026-01-02T00:00:00Z",
        gender: "Female",
    } as ApiNomisIdResponse,
    shared,
    anchors: {
        nomiAnchorLooks: [
            {
                uuid: "a1",
                nomiId: 1,
                fidelity: 1,
                appearanceTraits: "Trendy",
                type: "User",
                platformAnchorLook: null,
                userAnchorLook: {
                    uuid: "u1",
                    previewHash: "h1",
                    generationProcess: "Lago",
                    style: "photorealistic",
                    appearancePrompts: "Pale skin",
                    aestheticPrompts: "baddie",
                },
            },
        ],
    },
    mind: null,
    messages: [
        {
            sent: "2026-06-01T12:00:00Z",
            text: "Hello <3",
            type: "User",
        } as never,
        { sent: "2026-06-01T12:05:00Z", text: "Hi!", type: "Nomi" } as never,
    ],
    voiceCalls: [
        {
            id: "vc1",
            started: "2026-06-02T18:00:00Z",
            ended: "2026-06-02T18:02:30Z",
            endError: null,
            retryCount: 0,
            nomiId: 1,
            messages: [
                {
                    id: "m1",
                    created: "2026-06-02T18:00:05Z",
                    type: "User",
                    text: "Hello?",
                },
                {
                    id: "m2",
                    created: "2026-06-02T18:00:12Z",
                    type: "Nomi",
                    text: "Finally, you called.",
                },
            ],
        },
    ],
};

describe("buildNomiMarkdown", () => {
    const md = buildNomiMarkdown(input);

    it("renders the Nomi Information header block", () => {
        expect(md).toContain("# Nomi Information");
        expect(md).toContain("- **ID**: 1");
        expect(md).toContain("- **Name**: Yuki");
        expect(md).toContain("- **Gender**: Female");
    });

    it("renders shared notes sections, omitting empty ones", () => {
        expect(md).toContain("# Shared Notes");
        expect(md).toContain("## Backstory");
        expect(md).toContain("We met in winter.");
        expect(md).toContain("## Inclination");
        expect(md).not.toContain("## Preferences");
    });

    it("renders the anchor image settings", () => {
        expect(md).toContain("# Image Settings");
        expect(md).toContain("## Yuki's Anchors");
        expect(md).toContain("### Anchor 1");
        expect(md).toContain("- **Anchor Type**: Lago");
        expect(md).toContain("- **Fidelity**: 100%");
        expect(md).toContain("- **Sticky Aesthetic**: baddie");
    });

    it("renders the chat log newest-first with escaped <pre> blocks", () => {
        expect(md).toContain("# Chat Log");
        expect(md).toContain("ordered from newest to oldest");
        // Nomi message ("Hi!") comes before the older user message.
        expect(md.indexOf("**Yuki**")).toBeLessThan(md.indexOf("**User**"));
        expect(md).toContain("Hello &lt;3"); // HTML escaped inside <pre>
    });

    it("renders voice calls with duration and transcript", () => {
        expect(md).toContain("# Voice Calls");
        // 2m30s call → (2:30) in the header.
        expect(md).toMatch(/## Call — .*\(2:30\)/);
        expect(md).toContain("Finally, you called.");
    });
});
