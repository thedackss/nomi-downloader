import { describe, expect, it } from "vitest";
import type { GroupJsonInput } from "../json/groupBuilder";
import { buildGroupMarkdown } from "./groupBuilder";

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
        { sent: "2026-06-01T12:00:00Z", text: "Hi <3", id: 1 } as never,
        {
            sent: "2026-06-01T12:01:00Z",
            text: "Hey!",
            nomiId: 7,
            nomiName: "Mya",
            id: 2,
        } as never,
    ],
};

describe("buildGroupMarkdown", () => {
    const md = buildGroupMarkdown(input);

    it("renders the Group Information block", () => {
        expect(md).toContain("# Group Information");
        expect(md).toContain("- **ID**: 42");
        expect(md).toContain("- **Name**: Movie Night");
        expect(md).toContain("- **Members**: Mya, Lexi");
    });

    it("renders the chat log newest-first with escaped <pre> blocks", () => {
        expect(md).toContain("# Chat Log");
        // Mya's later message comes before the older user message.
        expect(md.indexOf("**Mya**")).toBeLessThan(md.indexOf("**User**"));
        expect(md).toContain("Hi &lt;3");
    });
});
