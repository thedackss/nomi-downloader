/*
 * Live preview of the exported Shared Notes HTML.
 *
 * Run `npm run preview:notes` and open the printed localhost URL. Editing the
 * design (src/background/nomi/sharednotes/SharedNotesDocument.tsx or
 * sharednotes.scss) hot-reloads this preview.
 *
 * The sample below is fake data with the real section labels — tweak it to
 * exercise edge cases.
 */
import { renderSharedNotesDocument } from "../src/background/nomi/sharednotes/SharedNotesDocument";
import type {
    AnchorLook,
    SharedNote,
} from "../src/background/nomi/sharednotes/types";

// A 1x1 purple pixel so the preview works offline (no real anchor fetch).
const px =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#3b2a55"/><circle cx="100" cy="80" r="40" fill="#a855f7"/></svg>',
    );

const notes: SharedNote[] = [
    {
        title: "Backstory",
        description:
            "Use the backstory to highlight the core details you want your Nomi to prioritize.",
        content:
            "Yuki and I met two winters ago at a tiny bookshop café.\nShe runs a small ceramics studio and is fiercely protective of the people she loves.",
    },
    {
        title: "Inclination",
        description:
            "Give your Nomi direct guidance on how they should express themselves.",
        content:
            "Warm and playful, with dry humor. Speaks plainly and avoids over-apologizing.",
    },
    {
        title: "Current Roleplay",
        description:
            "Give your Nomi more context about your current situation.",
        content:
            "We're on a road trip down the coast, stopping at small towns.",
    },
    {
        title: "Your Appearance",
        description:
            "Describe your appearance to help your Nomi understand what you look like.",
        content: "Tall, short dark hair, usually in a worn denim jacket.",
    },
    {
        title: "Yuki's Appearance",
        description:
            "This shared note helps your Nomi understand what they look like in conversations.",
        content:
            "Petite, long auburn hair often tied up, clay-dusted apron, bright green eyes.",
    },
    {
        title: "Nicknames",
        description: "Enter the nickname(s) you'd like your Nomi to use.",
        content: "Sol, love",
    },
    {
        title: "Boundaries",
        description:
            "Describe any boundaries that you and/or your Nomi have in your relationship.",
        content: "No discussions of work stress after 9pm.",
    },
];

const anchors: AnchorLook[] = [
    { image: px, fidelity: 1, appearanceTraits: "Auburn hair, green eyes." },
    {
        image: px,
        fidelity: 0.4,
        appearanceTraits: "Trendy modern look, soft lighting.",
    },
];

const imageNotes: SharedNote[] = [
    {
        title: "Appearance Tendencies (global)",
        content: "Prefers natural light and candid framing.",
    },
    {
        title: "Yuki's Appearance V4",
        content: "Petite, auburn hair tied up, clay-dusted apron.",
    },
    {
        title: "Yuki's Appearance V3",
        content: "Auburn hair, green eyes, freckles.",
    },
];

const frame = document.getElementById("preview") as HTMLIFrameElement | null;
if (frame) {
    frame.srcdoc = renderSharedNotesDocument({
        name: "Yuki",
        generatedAt: new Date().toISOString(),
        notes,
        anchors,
        imageNotes,
    });
}
