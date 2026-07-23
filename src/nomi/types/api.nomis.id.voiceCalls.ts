import type { VoiceCall } from "./api.nomis.id.chat";

/** GET /nomis/:id/voice-calls/:callId/messages — a call's transcript. */
export interface ApiVoiceCallMessagesResponse {
    voiceCallMessages: VoiceCallMessage[];
}

export interface VoiceCallMessage {
    id: string;
    created: string;
    type: "User" | "Nomi" | string;
    text: string;
}

/** A voice call with its transcript attached (empty if the fetch failed). */
export interface VoiceCallWithMessages extends VoiceCall {
    messages: VoiceCallMessage[];
}
