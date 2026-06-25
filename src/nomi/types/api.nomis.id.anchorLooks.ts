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
    /** 0–1 fidelity weight. */
    fidelity: number;
    appearanceTraits: string | null;
    type: string;
    userAnchorLook: UserAnchorLook | null;
}

interface UserAnchorLook {
    uuid: string;
    /** Hash used to build the preview image URL. */
    previewHash: string | null;
}
