import { describe, expect, it } from "vitest";
import { type BundleIndexInput, buildBundleIndexHtml } from "./indexHtml";

const base: BundleIndexInput = {
    name: "Lyra",
    nomiId: 42,
    generatedAt: "2026-07-23T00:00:00.000Z",
    chatParts: ["Lyra_chat.html"],
    messageCount: 1234,
    sharedNotesFile: "Lyra_shared-notes.html",
    mindMap: { file: "Lyra_mind-map.html", termCount: 34 },
    dataFile: "Lyra_data.json",
    album: [
        {
            path: "album/nomi_1_0_2026-07-01.webp",
            type: "Photo",
            prompt: null,
            date: "2026-07-01",
        },
        {
            path: "album/nomi_1_1_2026-07-01.webp",
            type: "Art",
            prompt: "a candid shot at the kitchen sink",
            date: "2026-07-01",
        },
        {
            path: "album/nomi_1_5_2026-07-02.mp4",
            type: "Video",
            prompt: null,
            date: "2026-07-02",
        },
    ],
    voiceFiles: ["voice/voice_1_2026-07-03.flac"],
    calls: [
        {
            started: "2026-07-23T00:58:05Z",
            ended: "2026-07-23T01:00:35Z",
            anchor: "call-20260723005805",
        },
    ],
};

describe("buildBundleIndexHtml", () => {
    it("links every present section by its Nomi-prefixed filename", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain('href="Lyra_chat.html"');
        expect(html).toContain('href="Lyra_shared-notes.html"');
        expect(html).toContain('href="Lyra_mind-map.html"');
        expect(html).toContain('href="Lyra_data.json"');
    });

    it("shows card counts and a link to the Nomi", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain("1,234 messages");
        expect(html).toContain("34 memory terms");
        expect(html).toContain('href="https://beta.nomi.ai/nomis/42"');
    });

    it("uses no em dashes", () => {
        expect(buildBundleIndexHtml(base)).not.toContain("—");
    });

    it("omits sections that are missing", () => {
        const html = buildBundleIndexHtml({
            ...base,
            chatParts: [],
            sharedNotesFile: undefined,
            mindMap: undefined,
            dataFile: undefined,
        });
        expect(html).not.toContain("chat.html");
        expect(html).not.toContain("shared-notes.html");
        expect(html).not.toContain("mind-map.html");
        expect(html).not.toContain("data.json");
    });

    it("lists chat parts individually when the chat is split", () => {
        const html = buildBundleIndexHtml({
            ...base,
            chatParts: ["chat.html", "chat_part2.html"],
        });
        expect(html).toContain("2 parts");
        expect(html).toContain('href="chat_part2.html"');
    });

    it("groups the album by type with counts", () => {
        const html = buildBundleIndexHtml(base);
        // One section header per non-empty type.
        expect(html).toContain("Selfies");
        expect(html).toContain("Art");
        expect(html).toContain("Videos");
        // No Edits section when there are none.
        expect(html).not.toContain(">Edits");
        expect(html).toContain('src="album/nomi_1_0_2026-07-01.webp"');
        expect(html).toContain('<video src="album/nomi_1_5_2026-07-02.mp4"');
    });

    it("shows a generation prompt as a caption and a lightbox data attr", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain("a candid shot at the kitchen sink");
        expect(html).toContain(
            'data-prompt="a candid shot at the kitchen sink"',
        );
        // The lightbox scaffolding is present.
        expect(html).toContain('id="lb"');
    });

    it("lists voice calls with a duration, deep-linked to the chat anchor", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain("Voice calls");
        expect(html).toContain("2:30");
        expect(html).toContain('href="Lyra_chat.html#call-20260723005805"');

        const none = buildBundleIndexHtml({ ...base, calls: [] });
        expect(none).not.toContain("Voice calls");
    });

    it("renders voice messages as audio players, and omits the section when empty", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain("Voice messages");
        expect(html).toContain(
            '<audio controls preload="none" src="voice/voice_1_2026-07-03.flac">',
        );

        const none = buildBundleIndexHtml({ ...base, voiceFiles: [] });
        expect(none).not.toContain("Voice messages");
    });

    it("escapes the Nomi name", () => {
        const html = buildBundleIndexHtml({
            ...base,
            name: '<script>alert("x")</script>',
        });
        expect(html).not.toContain('<script>alert("x")</script>');
        expect(html).toContain("&lt;script&gt;");
    });
});
