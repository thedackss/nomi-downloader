// Structured JSON export for a group chat: group facts + chat log. With
// `rawData`, the untouched messages payload is attached under `raw`.
//
// Pure data transform, React-free so it can run in the service worker.

import type { GroupChatInfo } from "../../../nomi/interfaces/downloadGroupChat";
import type {
    GroupMessage,
    GroupSelfieRequest,
} from "../../../nomi/types/api.groupChats.id.messages";

export interface GroupJsonInput {
    groupId: number;
    name: string;
    info?: GroupChatInfo;
    messages: Array<GroupMessage | GroupSelfieRequest>;
}

export function buildGroupChat(
    messages: Array<GroupMessage | GroupSelfieRequest>,
) {
    return messages
        .filter((m): m is GroupMessage => "sent" in m)
        .map((m) => ({
            date: m.sent,
            message: m.text,
            // The user's own messages have no nomiName.
            sender: m.nomiName ?? "User",
        }));
}

export function buildGroupJson(input: GroupJsonInput, rawData: boolean) {
    const { groupId, name, info, messages } = input;

    const structured = {
        group: {
            id: groupId,
            name,
            type: info?.type ?? "",
            created: info?.created ?? "",
            imageStyle: info?.imageStyle ?? "",
            members: info?.members ?? [],
            chat: buildGroupChat(messages),
        },
    };

    if (!rawData) return structured;

    return { ...structured, raw: { messages } };
}
