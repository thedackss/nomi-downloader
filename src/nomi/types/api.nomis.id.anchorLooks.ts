// GET /nomis/:id/anchor-looks
//
// The Nomi's saved "anchor looks" (image settings). Only the fields used by the
// Shared Notes export are typed; the response carries more per look.

export interface ApiAnchorLooksResponse {
    nomiAnchorLooks: AnchorLookItem[];
}

export interface AnchorLookItem {
    uuid: string;
    nomiId: number;
    /** Fidelity weight (can exceed 1). */
    fidelity: number;
    appearanceTraits: string | null;
    /** "User" for custom looks, "Platform" for the built-in defaults. */
    type: string;
    /** Present on the built-in (default) anchors. */
    platformAnchorLook: AnchorLookDetail | null;
    /** Present on custom anchors. */
    userAnchorLook: AnchorLookDetail | null;
}

interface AnchorLookDetail {
    uuid: string;
    /** Hash used to build the preview image URL. */
    previewHash: string | null;
    /** Generation engine ("Anchor Type" in the UI), e.g. "Riva" or "Lago". */
    generationProcess: string | null;
    /** Render style, e.g. "photorealistic" or "nomi anime". */
    style: string | null;
    /** Detailed appearance description ("Additional Appearance Traits"). */
    appearancePrompts: string | null;
    /** Aesthetic keywords ("Sticky Aesthetic"). */
    aestheticPrompts: string | null;
}
