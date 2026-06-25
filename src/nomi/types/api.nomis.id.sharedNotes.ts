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
    nomiAppearance: string | null;
    communicationStyle: string | null;
    updated: string;
}
