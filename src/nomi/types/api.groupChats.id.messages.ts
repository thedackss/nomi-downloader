// GET /group-chats/:id/messages

export interface ApiGroupMessagesResponse {
    selfies: GroupSelfieRequest[];
    messages: GroupMessage[];
    /** Cursor for the next (older) page; absent on the last page. */
    nextMaxDate?: string;
}

export interface GroupMessage {
    uuid: string;
    groupChatId: number;
    /** Absent for the user's own messages. */
    nomiId?: number;
    /** Speaker name; absent for the user's own messages. */
    nomiName?: string;
    text: string;
    sent: string;
    timezone?: string;
    hidden?: boolean;
    isVoiceMessage?: boolean;
    id: number;
}

export interface GroupSelfieRequest {
    id: number;
    nomiIds: number[];
    completed: string;
    selfies: GroupSelfie[];
}

export interface GroupSelfie {
    id: string;
    selfieRequestId: number;
    hidden?: boolean;
    nsfwScore?: number;
}
