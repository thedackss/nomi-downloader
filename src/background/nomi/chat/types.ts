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
          /** Flag the transcript as a spoken (voice) message. */
          isVoice?: boolean;
          /** Relative path to the message's audio file, when exported. */
          audioSrc?: string;
      }
    | {
          kind: "selfie";
          src: string;
          /** Generation prompt, when the image was made from one. */
          prompt?: string;
      }
    | { kind: "failed" }
    | {
          kind: "voiceCall";
          started: string;
          ended?: string;
          /** Stable in-page anchor id, so the index can link to this call. */
          anchor?: string;
          messages: VoiceCallLine[];
      };

/**
 * A stable, collision-free anchor id for a call, derived from its start time.
 * Used both as the chat section's id and the index link target, so they match.
 */
export function callAnchor(started: string): string {
    return `call-${started.replace(/[^0-9]/g, "")}`;
}

/** One transcript line inside a voice-call section. */
export interface VoiceCallLine {
    isNomi: boolean;
    text: string;
    created: string;
}

/** A labeled fact shown in the info card at the top of the chat (group chats). */
export interface ChatInfoRow {
    label: string;
    value: string;
}

export interface ChatRenderPayload {
    /** Nomi name shown in the header. */
    name: string;
    /** Nomi id, for the "Open on Nomi.ai" header link (omitted for groups). */
    nomiId?: number;
    /** Avatar as a data URI; omitted if it couldn't be fetched. */
    avatar?: string;
    /** Profile video as a data URI; played in the header when present. */
    avatarVideo?: string;
    /** Optional facts rendered as a card above the messages (group chats). */
    info?: ChatInfoRow[];
    items: ChatItem[];
}
