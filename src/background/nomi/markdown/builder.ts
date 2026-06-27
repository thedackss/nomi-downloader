// Renders the same data as the JSON export (minus raw) into a human-readable
// Markdown document, following the layout in ~/dev/nomi/files references:
// "# Nomi Information", "# Shared Notes" with "## Section" headers, and a
// "# Chat Log" of <pre> blocks ordered newest to oldest. Image Settings and
// Mind Map sections are added in the same style.
//
// Pure data transform, React-free so it can run in the service worker.

import type { Message } from "../../../nomi/types/api.nomis.id.chat";
import type { NomiJsonInput } from "../json/builder";
import { buildMindMapPayload } from "../mindmap/builder";
import {
    buildAnchorRefs,
    buildImageNotes,
    buildSharedNotes,
} from "../sharednotes/builder";

/** Wrap chat text in a whitespace-preserving <pre>, escaping HTML. */
function pre(text: string): string {
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return `<pre style="white-space: pre-wrap; word-wrap: break-word;">${escaped}</pre>`;
}

export function buildNomiMarkdown(input: NomiJsonInput): string {
    const { nomiId, nomi, shared, anchors, mind, messages } = input;
    const name = nomi.name;
    const out: string[] = [];

    out.push("# Nomi Information");
    out.push(`- **ID**: ${nomi.id}`);
    out.push(`- **Name**: ${name}`);
    out.push(`- **Created**: ${nomi.created}`);
    out.push(`- **Gender**: ${nomi.gender}`);
    out.push("");

    const notes = shared ? buildSharedNotes(name, shared) : [];
    if (notes.length > 0) {
        out.push("# Shared Notes");
        for (const note of notes) {
            out.push(`## ${note.title}`);
            out.push(note.content);
            out.push("");
        }
    }

    const anchorRefs = anchors ? buildAnchorRefs(nomiId, anchors) : [];
    const imageNotes = shared ? buildImageNotes(name, shared) : [];
    if (anchorRefs.length > 0 || imageNotes.length > 0) {
        out.push("# Image Settings");
        if (anchorRefs.length > 0) {
            out.push(`## ${name}'s Anchors`);
            anchorRefs.forEach((anchor, i) => {
                out.push(`### Anchor ${i + 1}`);
                if (anchor.anchorType)
                    out.push(`- **Anchor Type**: ${anchor.anchorType}`);
                if (anchor.style) out.push(`- **Style**: ${anchor.style}`);
                out.push(
                    `- **Fidelity**: ${Math.round(anchor.fidelity * 100)}%`,
                );
                if (anchor.appearanceTraits)
                    out.push(
                        `- **Appearance Traits**: ${anchor.appearanceTraits}`,
                    );
                if (anchor.additionalTraits)
                    out.push(
                        `- **Additional Appearance Traits**: ${anchor.additionalTraits}`,
                    );
                if (anchor.stickyAesthetic)
                    out.push(
                        `- **Sticky Aesthetic**: ${anchor.stickyAesthetic}`,
                    );
                out.push("");
            });
        }
        for (const note of imageNotes) {
            out.push(`## ${note.title}`);
            out.push(note.content);
            out.push("");
        }
    }

    if (mind) {
        const { entries } = buildMindMapPayload(
            name,
            mind,
            new Date().toISOString(),
        );
        if (entries.length > 0) {
            out.push("# Mind Map");
            for (const entry of entries) {
                out.push(`## ${entry.title}`);
                out.push(`- ${entry.category} · ${entry.memoryCount} memories`);
                if (entry.dossier) out.push(entry.dossier);
                if (entry.relations.length > 0) {
                    const rels = entry.relations
                        .map((r) => `${r.title} (${r.sharedMemories})`)
                        .join(", ");
                    out.push(`**Related to:** ${rels}`);
                }
                out.push("");
            }
        }
    }

    const chat = messages.filter((m): m is Message => "sent" in m);
    if (chat.length > 0) {
        out.push("# Chat Log");
        out.push("> Messages are ordered from newest to oldest.");
        out.push("");
        // getMessages returns oldest -> newest; walk backwards for newest first.
        for (let i = chat.length - 1; i >= 0; i--) {
            const message = chat[i];
            const sender =
                message.type === "Nomi" || message.type === "NomiStarter"
                    ? name
                    : "User";
            out.push(`**${sender}**`);
            out.push(pre(message.text));
            out.push("");
        }
    }

    return out.join("\n");
}
