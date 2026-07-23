export interface ApiNomisMessagesResponse {
    messages: Message[];
    selfies: SelfieRequest[];
    voiceCalls: VoiceCall[];
    nextMax: string | undefined;
    roleplays: unknown[];
}

/** A voice call listed in the chat feed; its transcript is a separate fetch. */
export interface VoiceCall {
    id: string;
    started: string;
    ended: string | null;
    endError: unknown;
    retryCount: number;
    nomiId: number;
}

/** Stored TTS audio for a voice message ("Completed" = downloadable .flac). */
export interface SpeechInfo {
    status: string;
    updated: string;
    mimeType: string;
    version: number;
    durationInSeconds: number;
}

export interface Message {
    uuid: string;
    sent: string;
    type: string;
    sentDateUtc: string;
    sentDateLocal: string;
    hidden: boolean;
    unread: boolean;
    nomiInitiated: boolean;
    isVoiceMessage: boolean;
    timezone: string;
    text: string;
    aiBackendId?: string;
    speech: SpeechInfo | null;
    policyViolations: unknown[];
    attachment?: Attachment;
}

export interface Attachment {
    fileName: string;
    mimeType: string;
    sizeInBytes: number;
    sha256HashBase64: string;
    created: string;
    reaped: unknown;
}

export interface SelfieRequest {
    id: number;
    nomiIds: number[];
    completed: string;
    system: string;
    selfies: Selfie[];
}

export interface Selfie {
    id: string;
    hidden: boolean;
    nsfwScore: number;
    reaction: unknown;
    feedback: unknown;
    flagged: unknown;
    selfieRequestId: number;
}
