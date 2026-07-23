// Assembles the structured JSON export for a Nomi: shared notes, image
// settings, mind map and chat — mirroring the HTML exports but as data. With
// `rawData`, the untouched API responses are attached under `raw`.
//
// Pure data transform, React-free so it can run in the service worker.

import type { ApiNomisIdResponse } from "../../../nomi/types/api.nomis.id";
import type { ApiAnchorLooksResponse } from "../../../nomi/types/api.nomis.id.anchorLooks";
import type {
    Message,
    SelfieRequest,
} from "../../../nomi/types/api.nomis.id.chat";
import type { ApiSharedNotesResponse } from "../../../nomi/types/api.nomis.id.sharedNotes";
import type { VoiceCallWithMessages } from "../../../nomi/types/api.nomis.id.voiceCalls";
import { buildMindMapPayload, type MindInfoData } from "../mindmap/builder";
import { buildAnchorRefs } from "../sharednotes/builder";

export interface NomiJsonInput {
    nomiId: number;
    nomi: ApiNomisIdResponse;
    shared: ApiSharedNotesResponse | null;
    anchors: ApiAnchorLooksResponse | null;
    mind: MindInfoData | null;
    messages: Array<Message | SelfieRequest>;
    voiceCalls: VoiceCallWithMessages[];
}

const str = (value: string | null | undefined) => value ?? "";

function buildChat(name: string, messages: Array<Message | SelfieRequest>) {
    return messages
        .filter((m): m is Message => "sent" in m)
        .map((m) => ({
            date: m.sent,
            message: m.text,
            sender:
                m.type === "Nomi" || m.type === "NomiStarter" ? name : "User",
        }));
}

function buildVoiceCalls(name: string, calls: VoiceCallWithMessages[]) {
    return calls.map((call) => ({
        started: call.started,
        ended: call.ended,
        messages: call.messages.map((m) => ({
            date: m.created,
            message: m.text,
            sender: m.type === "User" ? "User" : name,
        })),
    }));
}

function buildMindMap(name: string, mind: MindInfoData | null) {
    if (!mind) return null;
    const { nodes, edges, entries } = buildMindMapPayload(
        name,
        mind,
        new Date().toISOString(),
    );
    return { nodes, edges, entries };
}

export function buildNomiJson(input: NomiJsonInput, rawData: boolean) {
    const { nomiId, nomi, shared, anchors, mind, messages, voiceCalls } = input;
    const name = nomi.name;

    const structured = {
        nomi: {
            name,
            sharedNotes: {
                backstory: str(shared?.backstory),
                inclination: str(shared?.communicationStyle),
                currentRoleplay: str(shared?.roleplay),
                yourAppearance: str(shared?.userAppearance),
                chatAppearance: str(shared?.nomiChatAppearance),
                nicknames: str(shared?.nicknames),
                preferences: str(shared?.preferences),
                desires: str(shared?.desires),
                boundaries: str(shared?.boundaries),
            },
            imageSettings: {
                anchors: anchors
                    ? buildAnchorRefs(nomiId, anchors).map((a) => ({
                          anchorType: a.anchorType,
                          style: a.style,
                          fidelity: a.fidelity,
                          appearanceTraits: a.appearanceTraits,
                          additionalTraits: a.additionalTraits,
                          stickyAesthetic: a.stickyAesthetic,
                          previewUrl: a.imageUrl ?? null,
                      }))
                    : [],
                appearanceTendencies: str(shared?.selfieTendencies),
                appearanceV4: str(shared?.v4NomiAppearance),
                appearanceV3: str(shared?.nomiAppearance),
            },
            mindMap: buildMindMap(name, mind),
            chat: buildChat(name, messages),
            voiceCalls: buildVoiceCalls(name, voiceCalls),
        },
    };

    if (!rawData) return structured;

    return {
        ...structured,
        raw: {
            nomi,
            sharedNotes: shared,
            anchorLooks: anchors,
            mindMap: mind,
            messages,
            voiceCalls,
        },
    };
}
