// Plain, serializable description of a chat to render. Built in the service
// worker and sent to the offscreen document (which has a DOM) for rendering,
// so react-dom/server never loads in the worker.

export type ChatItem =
    | { kind: "message"; isNomi: boolean; text: string; sent: string }
    | { kind: "selfie"; src: string }
    | { kind: "failed" };

export interface ChatRenderPayload {
    /** Nomi name shown in the header. */
    name: string;
    /** Avatar as a data URI; omitted if it couldn't be fetched. */
    avatar?: string;
    items: ChatItem[];
}
