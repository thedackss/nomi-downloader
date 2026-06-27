// Renders the same data as the group JSON export into readable Markdown:
// "# Group Information" facts and a "# Chat Log" of <pre> blocks ordered
// newest to oldest.
//
// Pure data transform, React-free so it can run in the service worker.

import type { GroupMessage } from "../../../nomi/types/api.groupChats.id.messages";
import type { GroupJsonInput } from "../json/groupBuilder";

/** Wrap chat text in a whitespace-preserving <pre>, escaping HTML. */
function pre(text: string): string {
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    return `<pre style="white-space: pre-wrap; word-wrap: break-word;">${escaped}</pre>`;
}

export function buildGroupMarkdown(input: GroupJsonInput): string {
    const { groupId, name, info, messages } = input;
    const out: string[] = [];

    out.push("# Group Information");
    out.push(`- **ID**: ${groupId}`);
    out.push(`- **Name**: ${name}`);
    if (info?.type) out.push(`- **Type**: ${info.type}`);
    if (info?.created) out.push(`- **Created**: ${info.created}`);
    if (info?.imageStyle) out.push(`- **Image style**: ${info.imageStyle}`);
    if (info?.members.length)
        out.push(`- **Members**: ${info.members.join(", ")}`);
    out.push("");

    const chat = messages.filter((m): m is GroupMessage => "sent" in m);
    if (chat.length > 0) {
        out.push("# Chat Log");
        out.push("> Messages are ordered from newest to oldest.");
        out.push("");
        // Messages come oldest -> newest; walk backwards for newest first.
        for (let i = chat.length - 1; i >= 0; i--) {
            const message = chat[i];
            out.push(`**${message.nomiName ?? "User"}**`);
            out.push(pre(message.text));
            out.push("");
        }
    }

    return out.join("\n");
}
