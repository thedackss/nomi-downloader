export interface ApiNomisMessagesResponse {
    messages: Message[];
    selfies: SelfieRequest[];
    voiceCalls: unknown[];
    nextMax: string | undefined;
    roleplays: unknown[];
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
    speech: unknown;
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
