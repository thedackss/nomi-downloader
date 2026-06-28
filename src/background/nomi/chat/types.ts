// Plain, serializable description of a chat to render. Built in the service
// worker and sent to the offscreen document (which has a DOM) for rendering,
// so react-dom/server never loads in the worker.

export type ChatItem =
    | {
          kind: "message";
          isNomi: boolean;
          text: string;
          sent: string;
          /** Speaker label, shown above the bubble (used by group chats). */
          name?: string;
      }
    | { kind: "selfie"; src: string }
    | { kind: "failed" };

/** A labeled fact shown in the info card at the top of the chat (group chats). */
export interface ChatInfoRow {
    label: string;
    value: string;
}

export interface ChatRenderPayload {
    /** Nomi name shown in the header. */
    name: string;
    /** Avatar as a data URI; omitted if it couldn't be fetched. */
    avatar?: string;
    /** Profile video as a data URI; played in the header when present. */
    avatarVideo?: string;
    /** Optional facts rendered as a card above the messages (group chats). */
    info?: ChatInfoRow[];
    items: ChatItem[];
}
