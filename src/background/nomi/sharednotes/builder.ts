// Maps the raw GET /nomis/:id/shared-notes response into the normalized
// SharedNote[] the renderer consumes. Pure data transform, intentionally
// React-free so it can run in the service worker.

import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import type { SharedNote, SharedNotesRenderPayload } from "./types";

/**
 * The Shared Notes sections, in the order the nomi.ai UI shows them. Each entry
 * pairs an API field with its display title and the (static UI) helper copy.
 * `{name}` in a title is replaced with the Nomi's name.
 */
const SECTIONS: Array<{
    field: keyof ApiSharedNotesResponse;
    title: string;
    description: string;
}> = [
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
        field: "nomiAppearance",
        title: "{name}'s Appearance",
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

/** Normalize the raw response into the notes that actually have content. */
export function buildSharedNotes(
    name: string,
    data: ApiSharedNotesResponse,
): SharedNote[] {
    const notes: SharedNote[] = [];
    for (const section of SECTIONS) {
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

export function buildSharedNotesPayload(
    name: string,
    data: ApiSharedNotesResponse,
    generatedAt: string,
    avatar?: string,
): SharedNotesRenderPayload {
    return { name, avatar, generatedAt, notes: buildSharedNotes(name, data) };
}
