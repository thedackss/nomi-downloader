import { describe, expect, it } from "vitest";
import { buildBundleIndexHtml } from "./indexHtml";

const base = {
    name: "Lyra",
    generatedAt: "2026-07-23T00:00:00.000Z",
    chatParts: ["chat.html"],
    hasSharedNotes: true,
    hasMindMap: true,
    hasJson: true,
    galleryImages: ["album/photo/nomi_1_0_2026-07-01.webp"],
    videos: ["album/video/nomi_1_5_2026-07-02.mp4"],
    voiceFiles: ["voice/voice_1_2026-07-03.flac"],
};

describe("buildBundleIndexHtml", () => {
    it("links every present section", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain('href="chat.html"');
        expect(html).toContain('href="shared-notes.html"');
        expect(html).toContain('href="mind-map.html"');
        expect(html).toContain('href="data.json"');
    });

    it("omits sections that are missing", () => {
        const html = buildBundleIndexHtml({
            ...base,
            chatParts: [],
            hasSharedNotes: false,
            hasMindMap: false,
            hasJson: false,
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

    it("renders the gallery and video list with relative paths", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain('src="album/photo/nomi_1_0_2026-07-01.webp"');
        expect(html).toContain('href="album/video/nomi_1_5_2026-07-02.mp4"');
        expect(html).toContain("Album — 1 images, 1 videos");
    });

    it("renders voice messages as audio players, and omits the section when empty", () => {
        const html = buildBundleIndexHtml(base);
        expect(html).toContain("Voice messages — 1");
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
