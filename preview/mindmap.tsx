/*
 * Live preview of the exported mind map HTML.
 *
 * Run `npm run preview:mindmap` and open the printed localhost URL. Editing the
 * design (src/background/nomi/mindmap/MindMapDocument.tsx or mindmap.scss)
 * hot-reloads this preview, so you can iterate on the look without building the
 * extension.
 *
 * The sample below is fake data — tweak it to exercise edge cases.
 */
import { renderMindMapDocument } from "../src/background/nomi/mindmap/MindMapDocument";
import type {
    MindMapEntry,
    MindMapGraphEdge,
    MindMapGraphNode,
} from "../src/background/nomi/mindmap/types";

const node = (
    uuid: string,
    title: string,
    category: string,
    memoryCount: number,
): MindMapGraphNode => ({
    uuid,
    title,
    category,
    priority: "Standard",
    memoryCount,
    state: "Default",
});

const nodes: MindMapGraphNode[] = [
    node("sarah", "Sarah", "Entity", 38),
    node("dacks", "Dacks", "Entity", 30),
    node("zack", "Zack", "Entity", 18),
    node("bully", "Bully's house (suburban home)", "Entity", 14),
    node("maternal", "maternal sacrifice", "Entity", 12),
    node("dominance", "dominance", "Keyword", 9),
    node("cognitive", "cognitive dissonance", "Keyword", 7),
    node("substitution", "substitution", "Keyword", 6),
    node("maternal2", "maternal instinct", "Keyword", 5),
    node("protect", "Protect the family", "Goal", 4),
];

const edge = (
    fromUuid: string,
    toUuid: string,
    sharedMemoryCount: number,
): MindMapGraphEdge => ({ fromUuid, toUuid, sharedMemoryCount });

const edges: MindMapGraphEdge[] = [
    edge("sarah", "dacks", 12),
    edge("sarah", "zack", 6),
    edge("sarah", "bully", 5),
    edge("sarah", "dominance", 4),
    edge("sarah", "substitution", 3),
    edge("sarah", "maternal2", 3),
    edge("dacks", "zack", 4),
    edge("dacks", "cognitive", 3),
    edge("dacks", "dominance", 5),
    edge("dacks", "bully", 4),
    edge("zack", "maternal", 2),
    edge("substitution", "maternal", 3),
    edge("bully", "protect", 2),
    edge("dominance", "cognitive", 2),
];

const entry = (
    uuid: string,
    title: string,
    category: string,
    memoryCount: number,
    dossier: string | null,
    relations: MindMapEntry["relations"] = [],
): MindMapEntry => ({
    uuid,
    title,
    category,
    priority: "Standard",
    memoryCount,
    created: "2026-05-16T10:00:00.000Z",
    aiEdited: "2026-06-13T18:30:00.000Z",
    dossier,
    relations,
});

const entries: MindMapEntry[] = [
    entry(
        "sarah",
        "Sarah",
        "Entity",
        38,
        "**Sarah** is the central figure in many of our conversations. She is *fiercely protective* and often acts as a maternal substitute. [M1] Her arc revolves around the tension between dominance and care.",
        [
            { title: "Dacks", sharedMemories: 12 },
            { title: "Zack", sharedMemories: 6 },
            { title: "Bully's house (suburban home)", sharedMemories: 5 },
        ],
    ),
    entry(
        "dacks",
        "Dacks",
        "Entity",
        30,
        "**Dacks** wrestles with *cognitive dissonance* around asserting dominance while wanting connection.",
        [
            { title: "Sarah", sharedMemories: 12 },
            { title: "dominance", sharedMemories: 5 },
        ],
    ),
    entry("zack", "Zack", "Entity", 18, null, [
        { title: "Sarah", sharedMemories: 6 },
    ]),
    entry(
        "bully",
        "Bully's house (suburban home)",
        "Entity",
        14,
        "A quiet suburban home that recurs as a setting for confrontation.",
        [{ title: "Protect the family", sharedMemories: 2 }],
    ),
    entry("dominance", "dominance", "Keyword", 9, "A recurring **theme**.", [
        { title: "Sarah", sharedMemories: 4 },
        { title: "Dacks", sharedMemories: 5 },
    ]),
    entry("cognitive", "cognitive dissonance", "Keyword", 7, null, []),
    entry("substitution", "substitution", "Keyword", 6, null, []),
    entry(
        "protect",
        "Protect the family",
        "Goal",
        4,
        "An aspiration that drives several decisions.",
        [],
    ),
];

const frame = document.getElementById("preview") as HTMLIFrameElement | null;
if (frame) {
    frame.srcdoc = renderMindMapDocument({
        name: "Veronica",
        generatedAt: new Date().toISOString(),
        nodes,
        edges,
        entries,
    });
}
