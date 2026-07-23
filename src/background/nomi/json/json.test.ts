import { describe, expect, it } from "vitest";
import type { ApiNomisIdResponse } from "../../../nomi/types/api.nomis.id";
import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import { buildNomiJson, type NomiJsonInput } from "./builder";

const shared = {
    nomiId: 1,
    backstory: "We met in winter.",
    roleplay: "On a road trip.",
    preferences: null,
    boundaries: null,
    nicknames: "Sol",
    desires: null,
    userAppearance: null,
    nomiChatAppearance: "Auburn hair.",
    nomiAppearance: "V3 look.",
    v4NomiAppearance: "V4 look.",
    selfieTendencies: "Natural light.",
    communicationStyle: "Warm and playful.",
    updated: "2026-06-25T00:00:00.000Z",
} satisfies ApiSharedNotesResponse;

const input: NomiJsonInput = {
    nomiId: 1,
    nomi: { name: "Yuki" } as ApiNomisIdResponse,
    shared,
    anchors: {
        nomiAnchorLooks: [
            {
                uuid: "a1",
                nomiId: 1,
                fidelity: 0.5,
                appearanceTraits: "Trendy",
                type: "User",
                platformAnchorLook: null,
                userAnchorLook: {
                    uuid: "u1",
                    previewHash: "hash1",
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
            text: "Hello",
            type: "Nomi",
        } as never,
        {
            sent: "2026-06-01T12:05:00Z",
            text: "Hi!",
            type: "User",
        } as never,
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

describe("buildNomiJson", () => {
    it("maps shared notes, image settings and chat into a clean structure", () => {
        const out = buildNomiJson(input, false) as {
            nomi: Record<string, unknown>;
        } & { raw?: unknown };

        const n = out.nomi as {
            name: string;
            sharedNotes: Record<string, string>;
            imageSettings: { anchors: unknown[]; appearanceV4: string };
            chat: Array<{ date: string; message: string; sender: string }>;
        };

        expect(n.name).toBe("Yuki");
        expect(n.sharedNotes.inclination).toBe("Warm and playful.");
        expect(n.sharedNotes.chatAppearance).toBe("Auburn hair.");
        // Empty fields are kept (as "") so the schema stays stable.
        expect(n.sharedNotes.preferences).toBe("");
        expect(n.imageSettings.appearanceV4).toBe("V4 look.");
        expect(n.imageSettings.anchors).toHaveLength(1);
        expect(n.chat).toEqual([
            { date: "2026-06-01T12:00:00Z", message: "Hello", sender: "Yuki" },
            { date: "2026-06-01T12:05:00Z", message: "Hi!", sender: "User" },
        ]);
        expect(out.raw).toBeUndefined();
    });

    it("maps voice calls with their transcripts", () => {
        const out = buildNomiJson(input, false) as {
            nomi: {
                voiceCalls: Array<{
                    started: string;
                    ended: string | null;
                    messages: Array<{
                        date: string;
                        message: string;
                        sender: string;
                    }>;
                }>;
            };
        };

        expect(out.nomi.voiceCalls).toHaveLength(1);
        const call = out.nomi.voiceCalls[0];
        expect(call.started).toBe("2026-06-02T18:00:00Z");
        expect(call.messages).toEqual([
            {
                date: "2026-06-02T18:00:05Z",
                message: "Hello?",
                sender: "User",
            },
            {
                date: "2026-06-02T18:00:12Z",
                message: "Finally, you called.",
                sender: "Yuki",
            },
        ]);
    });

    it("attaches raw API responses when rawData is enabled", () => {
        const out = buildNomiJson(input, true) as { raw?: { nomi: unknown } };
        expect(out.raw).toBeDefined();
        expect(out.raw?.nomi).toBe(input.nomi);
    });
});
