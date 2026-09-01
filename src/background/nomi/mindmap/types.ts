// Serializable payload for the exported mind map HTML. Built in the service
// worker (no DOM) and handed to the offscreen document, which renders it to a
// standalone HTML string via MindMapDocument.tsx.
//
// Keep this React-free so the worker can import it without pulling in
// react-dom/server (which needs `window` and crashes the service worker).

/** A node in the relationship graph (a Lore/Topic/Goal term). */
export interface MindMapGraphNode {
    uuid: string;
    title: string;
    /** Raw API category: "Entity" | "Keyword" | "Goal". */
    category: string;
    priority: string;
    memoryCount: number;
    state: string;
}

/** A connection between two graph nodes, weighted by shared memories. */
export interface MindMapGraphEdge {
    fromUuid: string;
    toUuid: string;
    sharedMemoryCount: number;
}

/** A single term with its full detail, shown in the table view. */
export interface MindMapEntry {
    uuid: string;
    title: string;
    category: string;
    priority: string;
    memoryCount: number;
    /** ISO date string. */
    created: string;
    /** ISO date string, or null if never AI-edited. */
    aiEdited: string | null;
    /** Markdown dossier text, or null. */
    dossier: string | null;
    /** Other terms this one shares memories with. */
    relations: Array<{ title: string; sharedMemories: number }>;
}

export interface MindMapRenderPayload {
    /** Nomi name, shown in the header and document title. */
    name: string;
    /** Nomi id, for the "Open on Nomi.ai" header link. */
    nomiId?: number;
    /** Avatar image as a data URI; omitted if it couldn't be fetched. */
    avatar?: string;
    /** Profile video as a data URI; played in the header when present. */
    avatarVideo?: string;
    /** ISO timestamp of when the export was generated. */
    generatedAt: string;
    nodes: MindMapGraphNode[];
    edges: MindMapGraphEdge[];
    entries: MindMapEntry[];
}
