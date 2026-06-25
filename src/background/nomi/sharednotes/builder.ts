// Maps the raw GET /nomis/:id/shared-notes and /anchor-looks responses into the
// normalized data the renderer consumes. Pure data transforms, intentionally
// React-free so they can run in the service worker (image fetching for anchors
// happens in the facade, which has the offscreen bridge).

import type { ApiAnchorLooksResponse } from "../../../nomi/types/api.nomis.id.anchorLooks";
import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import type { SharedNote } from "./types";

interface Section {
    field: keyof ApiSharedNotesResponse;
    title: string;
    description?: string;
}

/**
 * The "Shared Notes" text sections, in the order the nomi.ai UI shows them.
 * `{name}` in a title is replaced with the Nomi's name.
 */
const SECTIONS: Section[] = [
    {
        field: "backstory",
        title: "Backstory",
        description:
            "Use the backstory to highlight the core details you want your Nomi to prioritize.",
    },
    {
        field: "communicationStyle",
        title: "Inclination",
        description:
            "Give your Nomi direct guidance on how they should express themselves.",
    },
    {
        field: "roleplay",
        title: "Current Roleplay",
        description:
            "Give your Nomi more context about your current situation.",
    },
    {
        field: "userAppearance",
        title: "Your Appearance",
        description:
            "Describe your appearance to help your Nomi understand what you look like.",
    },
    {
        field: "nomiChatAppearance",
        title: "{name}'s Chat Appearance",
        description:
            "This shared note helps your Nomi understand what they look like in conversations.",
    },
    {
        field: "nicknames",
        title: "Nicknames",
        description: "Enter the nickname(s) you'd like your Nomi to use.",
    },
    {
        field: "preferences",
        title: "Preferences",
        description:
            "Describe preferences you and/or your Nomi has such as hobbies, interests.",
    },
    {
        field: "desires",
        title: "Desires",
        description:
            "Enter any desires you and/or your Nomi have within your relationship.",
    },
    {
        field: "boundaries",
        title: "Boundaries",
        description:
            "Describe any boundaries that you and/or your Nomi have in your relationship.",
    },
];

/** Text sections shown under "Image Settings" (besides the anchor gallery). */
const IMAGE_SECTIONS: Section[] = [
    {
        field: "selfieTendencies",
        title: "Appearance Tendencies (global)",
    },
    { field: "v4NomiAppearance", title: "{name}'s Appearance V4" },
    { field: "nomiAppearance", title: "{name}'s Appearance V3" },
];

function collect(
    name: string,
    data: ApiSharedNotesResponse,
    sections: Section[],
): SharedNote[] {
    const notes: SharedNote[] = [];
    for (const section of sections) {
        const content = (data[section.field] ?? "").toString().trim();
        if (!content) continue;
        notes.push({
            title: section.title.replace("{name}", name),
            description: section.description,
            content,
        });
    }
    return notes;
}

/** "Shared Notes" text sections that have content. */
export function buildSharedNotes(
    name: string,
    data: ApiSharedNotesResponse,
): SharedNote[] {
    return collect(name, data, SECTIONS);
}

/** "Image Settings" text sections (tendencies, V4/V3 appearance) with content. */
export function buildImageNotes(
    name: string,
    data: ApiSharedNotesResponse,
): SharedNote[] {
    return collect(name, data, IMAGE_SECTIONS);
}

/** Normalized anchor look with the preview image URL still to be fetched. */
export interface AnchorLookRef {
    fidelity: number;
    anchorType: string;
    style: string;
    appearanceTraits: string;
    additionalTraits: string;
    stickyAesthetic: string;
    /** Relative API path to the preview image, if available. */
    imageUrl?: string;
}

/** Map raw anchor looks to refs (image URL resolved, not yet fetched). */
export function buildAnchorRefs(
    nomiId: number,
    data: ApiAnchorLooksResponse,
): AnchorLookRef[] {
    return (data.nomiAnchorLooks ?? []).map((look) => {
        // Custom looks carry userAnchorLook; the built-in defaults (RIVA/LAGO)
        // carry platformAnchorLook instead — both hold the preview + details.
        const detail = look.userAnchorLook ?? look.platformAnchorLook;
        const hash = detail?.previewHash;
        const imageUrl = hash
            ? `nomis/${nomiId}/anchor-looks/${look.uuid}/previews/${hash}.webp`
            : undefined;
        return {
            fidelity: look.fidelity,
            anchorType: (detail?.generationProcess ?? "").trim(),
            style: (detail?.style ?? "").trim(),
            appearanceTraits: (look.appearanceTraits ?? "").trim(),
            additionalTraits: (detail?.appearancePrompts ?? "").trim(),
            stickyAesthetic: (detail?.aestheticPrompts ?? "").trim(),
            imageUrl,
        };
    });
}
