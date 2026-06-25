// Serializable payload for the exported Shared Notes HTML. Built in the service
// worker (no DOM) and handed to the offscreen document, which renders it to a
// standalone HTML string via SharedNotesDocument.tsx.
//
// Keep this React-free so the worker can import it without pulling in
// react-dom/server (which needs `window` and crashes the service worker).

/** One shared note, already normalized from the raw API shape. */
export interface SharedNote {
    /** Display title, e.g. "Backstory" or "Yuki's Appearance". */
    title: string;
    /** Helper copy shown under the title; omitted if empty. */
    description?: string;
    /** The note's content (the part the user actually wrote). */
    content: string;
}

/** One of the Nomi's saved anchor looks (image settings). */
export interface AnchorLook {
    /** Preview image as a data URI; omitted if it couldn't be fetched. */
    image?: string;
    /** Fidelity weight (can exceed 1). */
    fidelity: number;
    /** Appearance traits text; may be empty. */
    appearanceTraits: string;
    /** Engine + style label, e.g. "RIVA - Realistic"; may be empty. */
    label: string;
}

export interface SharedNotesRenderPayload {
    /** Nomi name, shown in the header and document title. */
    name: string;
    /** Avatar image as a data URI; omitted if it couldn't be fetched. */
    avatar?: string;
    /** ISO timestamp of when the export was generated. */
    generatedAt: string;
    /** "Shared Notes" text sections (empty ones dropped before rendering). */
    notes: SharedNote[];
    /** The Nomi's anchor looks, shown under "Image Settings". */
    anchors: AnchorLook[];
    /** Remaining "Image Settings" text sections (tendencies, V4/V3 appearance). */
    imageNotes: SharedNote[];
}
