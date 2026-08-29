import { describe, expect, it } from "vitest";
import type { ApiNomisIdResponse } from "../../../nomi/types/api.nomis.id";
import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import { filterNewerThan } from "../incrementalStore";
import type { NomiJsonInput } from "../json/builder";
import { applyMessageRange } from "../messageRange";
import { buildChatMarkdown, buildNomiMarkdown } from "./builder";

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

describe("buildChatMarkdown", () => {
    const md = buildChatMarkdown(input);

    it("includes the backstory (Shared Notes) and the chat log", () => {
        expect(md).toContain("# Shared Notes");
        expect(md).toContain("## Backstory");
        expect(md).toContain("We met in winter.");
        expect(md).toContain("# Chat Log");
        expect(md).toContain("Hello &lt;3");
        // Newest-first, same as the full export.
        expect(md.indexOf("**Yuki**")).toBeLessThan(md.indexOf("**User**"));
    });

    it("omits everything else (info, image settings, mind map, voice calls)", () => {
        expect(md).not.toContain("# Nomi Information");
        expect(md).not.toContain("# Image Settings");
        expect(md).not.toContain("# Mind Map");
        expect(md).not.toContain("# Voice Calls");
    });

    it("can be limited to the most recent messages (as the facade does)", () => {
        // Mirror the facade: slice to the last message, then render.
        const recent = buildChatMarkdown({
            ...input,
            messages: applyMessageRange(input.messages, 0, 0, 1),
        });
        expect(recent).toContain("Hi!"); // newest kept
        expect(recent).not.toContain("Hello &lt;3"); // older dropped
    });

    it("can export only messages newer than the last run (incremental)", () => {
        // Mirror the facade: filter to messages after a baseline, then render.
        const since = buildChatMarkdown({
            ...input,
            messages: filterNewerThan(
                input.messages,
                (m) => ("sent" in m ? m.sent : m.completed),
                "2026-06-01T12:02:00Z", // between the two messages
            ),
        });
        expect(since).toContain("Hi!"); // 12:05 kept
        expect(since).not.toContain("Hello &lt;3"); // 12:00 dropped
        expect(since).toContain("# Shared Notes"); // backstory still included
    });
});
