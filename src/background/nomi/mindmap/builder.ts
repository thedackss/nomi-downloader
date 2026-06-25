// Builds the serializable MindMapRenderPayload from the raw getMindInfo()
// response. Pure data transform, intentionally React-free so it can run in the
// service worker (the actual HTML render happens in the offscreen document).

import type { ApiMindMapsGraphResponse } from "../../../nomi/types/api.mindMaps.nomis.id.graph";
import type { MemoryTermItem } from "../../../nomi/types/api.mindMaps.nomis.id.memoryTerms";
import type { MindMapEntry, MindMapRenderPayload } from "./types";

/** Shape returned by NomiApiClient.getMindInfo(). */
export interface MindInfoData {
    graph: ApiMindMapsGraphResponse;
    terms: Array<{ category: string; items: MemoryTermItem[] }>;
}

export function buildMindMapPayload(
    name: string,
    data: MindInfoData,
    generatedAt: string,
    avatar?: string,
): MindMapRenderPayload {
    const nodes = data.graph.nodes.map((n) => ({
        uuid: n.uuid,
        title: n.title,
        category: String(n.category),
        priority: String(n.priority),
        memoryCount: n.memoryCount,
        state: String(n.state),
    }));

    const edges = data.graph.edges.map((e) => ({
        fromUuid: e.fromUuid,
        toUuid: e.toUuid,
        sharedMemoryCount: e.sharedMemoryCount,
    }));

    // Title lookup across every term (graph nodes + table items) so relations
    // can be labelled even when one side isn't a graph node.
    const titleByUuid = new Map<string, string>();
    for (const n of data.graph.nodes) titleByUuid.set(n.uuid, n.title);
    const allTerms = data.terms.flatMap((t) => t.items);
    for (const t of allTerms) titleByUuid.set(t.uuid, t.title);

    // Bidirectional relations keyed by term uuid.
    const relationsByUuid = new Map<
        string,
        Array<{ title: string; sharedMemories: number }>
    >();
    const addRelation = (uuid: string, otherUuid: string, shared: number) => {
        const title = titleByUuid.get(otherUuid);
        if (!title) return;
        const list = relationsByUuid.get(uuid) ?? [];
        list.push({ title, sharedMemories: shared });
        relationsByUuid.set(uuid, list);
    };
    for (const e of data.graph.edges) {
        addRelation(e.fromUuid, e.toUuid, e.sharedMemoryCount);
        addRelation(e.toUuid, e.fromUuid, e.sharedMemoryCount);
    }

    const entries: MindMapEntry[] = allTerms.map((t) => ({
        uuid: t.uuid,
        title: t.title,
        category: String(t.category),
        priority: String(t.priority),
        memoryCount: t.memoryCount,
        created: String(t.created),
        aiEdited: t.aiEdited ? String(t.aiEdited) : null,
        dossier: t.dossier ?? null,
        relations: (relationsByUuid.get(t.uuid) ?? []).sort(
            (a, b) => b.sharedMemories - a.sharedMemories,
        ),
    }));

    return { name, avatar, generatedAt, nodes, edges, entries };
}
