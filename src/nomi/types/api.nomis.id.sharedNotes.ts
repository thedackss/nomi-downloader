// GET /nomis/:id/shared-notes
//
// A flat object: each shared note is a top-level field (the saved value), with
// `<field>Draft` (unsaved edit) and `<field>Status` siblings we don't export.
// Note values are a string, "" when blank, or null when never set.

export interface ApiSharedNotesResponse {
    nomiId: number;
    backstory: string | null;
    roleplay: string | null;
    preferences: string | null;
    boundaries: string | null;
    nicknames: string | null;
    desires: string | null;
    userAppearance: string | null;
    /** Nomi appearance used in chat. */
    nomiChatAppearance: string | null;
    /** Legacy nomi appearance (V3). */
    nomiAppearance: string | null;
    /** Nomi appearance (V4). */
    v4NomiAppearance: string | null;
    /** Global appearance tendencies for selfies. */
    selfieTendencies: string | null;
    communicationStyle: string | null;
    updated: string;
}
