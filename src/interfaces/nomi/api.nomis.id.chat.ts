export interface ApiNomisMessagesResponse {
    messages: Message[];
    selfies: SelfieRequest[];
    voiceCalls: any[];
    nextMax: string | undefined;
    roleplays: any[];
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
    speech: any;
    policyViolations: any[];
    attachment?: Attachment;
}

export interface Attachment {
    fileName: string;
    mimeType: string;
    sizeInBytes: number;
    sha256HashBase64: string;
    created: string;
    reaped: any;
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
    reaction: any;
    feedback: any;
    flagged: any;
    selfieRequestId: number;
}
