import { describe, expect, it } from "vitest";
import { buildGroupJson, type GroupJsonInput } from "./groupBuilder";

const input: GroupJsonInput = {
    groupId: 42,
    name: "Movie Night",
    info: {
        type: "group",
        created: "2026-01-02T00:00:00Z",
        imageStyle: "Realistic",
        members: ["Mya", "Lexi"],
    },
    messages: [
        { sent: "2026-06-01T12:00:00Z", text: "Hi all", id: 1 } as never,
        {
            sent: "2026-06-01T12:01:00Z",
            text: "Hey!",
            nomiId: 7,
            nomiName: "Mya",
            id: 2,
        } as never,
        // A selfie request — excluded from the chat log.
        { completed: "2026-06-01T12:02:00Z", selfies: [] } as never,
    ],
};

describe("buildGroupJson", () => {
    it("builds the structured group export", () => {
        const json = buildGroupJson(input, false) as {
            group: Record<string, unknown>;
        };
        expect(json.group.id).toBe(42);
        expect(json.group.name).toBe("Movie Night");
        expect(json.group.members).toEqual(["Mya", "Lexi"]);
    });

    it("maps messages to sender/date/message, skipping selfie requests", () => {
        const json = buildGroupJson(input, false) as {
            group: { chat: Array<{ sender: string; message: string }> };
        };
        expect(json.group.chat).toHaveLength(2);
        expect(json.group.chat[0]).toEqual({
            date: "2026-06-01T12:00:00Z",
            message: "Hi all",
            sender: "User",
        });
        expect(json.group.chat[1].sender).toBe("Mya");
    });

    it("omits raw unless requested", () => {
        expect("raw" in buildGroupJson(input, false)).toBe(false);
        expect("raw" in buildGroupJson(input, true)).toBe(true);
    });
});
