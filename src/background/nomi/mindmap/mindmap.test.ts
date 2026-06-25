import { describe, expect, it } from "vitest";
import { buildMindMapPayload, type MindInfoData } from "./builder";
import { renderMindMapDocument } from "./MindMapDocument";
import css from "./mindmap.scss?inline";

const sampleData = {
    graph: {
        nodes: [
            {
                uuid: "a",
                title: "Sarah",
                category: "Entity",
                priority: "Standard",
                memoryCount: 12,
                state: "Default",
                error: null,
            },
            {
                uuid: "b",
                title: "dominance",
                category: "Keyword",
                priority: "Standard",
                memoryCount: 4,
                state: "Default",
                error: null,
            },
        ],
        edges: [{ fromUuid: "a", toUuid: "b", sharedMemoryCount: 3 }],
    },
    terms: [
        {
            category: "Entity",
            items: [
                {
                    uuid: "a",
                    title: "Sarah",
                    category: "Entity",
                    priority: "Standard",
                    memoryCount: 12,
                    created: "2026-05-16T10:00:00.000Z",
                    aiEdited: "2026-06-13T10:00:00.000Z",
                    dossier: "**Sarah** is central. [M1]",
                },
            ],
        },
    ],
    // The builder only reads the fields above; cast covers the unused API fields.
} as unknown as MindInfoData;

describe("mind map styling", () => {
    it("inlines the CSS with the classes the markup uses", () => {
        expect(css).toContain(".node");
        expect(css).toContain(".graph-view");
        expect(css).toContain(".table-view");
    });
});

describe("buildMindMapPayload", () => {
    const payload = buildMindMapPayload(
        "Veronica",
        sampleData,
        "2026-06-25T00:00:00.000Z",
        "data:image/webp;base64,AAAA",
    );

    it("carries graph nodes and edges through verbatim", () => {
        expect(payload.nodes).toHaveLength(2);
        expect(payload.edges).toEqual([
            { fromUuid: "a", toUuid: "b", sharedMemoryCount: 3 },
        ]);
    });

    it("builds entries with bidirectional relations from edges", () => {
        const sarah = payload.entries.find((e) => e.uuid === "a");
        expect(sarah?.relations).toEqual([
            { title: "dominance", sharedMemories: 3 },
        ]);
    });
});

describe("renderMindMapDocument", () => {
    const payload = buildMindMapPayload(
        "Veronica",
        sampleData,
        "2026-06-25T00:00:00.000Z",
        "data:image/webp;base64,AAAA",
    );
    const html = renderMindMapDocument(payload);

    it("produces a self-contained document", () => {
        expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
        expect(html).toContain("<style>");
        expect(html).toContain("</html>");
    });

    it("renders the header with the Nomi name and avatar", () => {
        expect(html).toContain("Veronica");
        expect(html).toContain('src="data:image/webp;base64,AAAA"');
    });

    it("inlines the graph data and the engine script", () => {
        expect(html).toContain('id="mindmap-data"');
        expect(html).toContain("Sarah");
        expect(html).toContain("requestAnimationFrame");
    });

    it("renders the dossier markdown as HTML, not raw asterisks", () => {
        expect(html).toContain("<strong>Sarah</strong>");
        expect(html).not.toContain("[M1]");
    });

    it("escapes '<' in the inlined graph JSON so it can't break out", () => {
        const evil = renderMindMapDocument({
            name: "Veronica",
            generatedAt: "2026-06-25T00:00:00.000Z",
            nodes: [
                {
                    uuid: "x",
                    title: "</script><b>pwn</b>",
                    category: "Entity",
                    priority: "Standard",
                    memoryCount: 1,
                    state: "Default",
                },
            ],
            edges: [],
            entries: [],
        });
        expect(evil).not.toContain("</script><b>pwn</b>");
        expect(evil).toContain("\\u003c");
    });
});
