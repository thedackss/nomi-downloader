import type {
    GroupArtSettings,
    GroupNomi,
    GroupSettings,
    MostRecentMessage,
    Note,
} from "./shared";

export interface ApiGroupChatsResponse {
    groupChats: GroupChat[];
}

export interface GroupChat {
    id: number;
    userId: number;
    name: string;
    status: string;
    nextSpeakerNomiId: null;
    deleted: null;
    updated: Date;
    created: Date;
    backchannelingEnabled: boolean;
    artSettings: GroupArtSettings;
    settings: GroupSettings;
    type: string;
    uuid: string;
    generatingSpeechGroupChatMessageId: null;
    mostRecentMessage: MostRecentMessage;
    note: Note;
    messageDraft: string;
    hasActiveArtRequest: boolean;
    nomis: GroupNomi[];
    socketToken: string;
}
