export interface ApiGroupChatsResponse {
    groupChats: GroupChat[];
}

interface GroupChat {
    id: number;
    userId: number;
    name: string;
    status: string;
    nextSpeakerNomiId: any;
    deleted: any;
    updated: string;
    created: string;
    backchannelingEnabled: boolean;
    artSettings: ArtSettings;
    settings: Settings;
    type: string;
    uuid: string;
    generatingSpeechGroupChatMessageId: any;
    mostRecentMessage: MostRecentMessage;
    note: Note;
    messageDraft: string;
    hasActiveArtRequest: boolean;
    nomis: Nomi[];
    socketToken: string;
}

interface ArtSettings {
    aspectRatio: any;
    imageStyle: string;
}

interface Settings {
    imageSystem: number;
    imageStyle: string;
    videoResolution: string;
}

interface MostRecentMessage {
    uuid: string;
    text: string;
    sent: string;
}

interface Note {
    draft: string;
    text: string;
    status: string;
    roleplay: string;
    roleplayDraft: string;
    roleplayStatus: string;
}

interface Nomi {
    id: number;
    userId: number;
    name: string;
    gender: string;
    created: string;
    updated: string;
    relationshipType: string;
    archived?: string;
    status: string;
    characterId: string;
    pictureImageId: string;
    pictureSelfieImageId?: string;
    settings: Settings2;
    artSettings: ArtSettings2;
    customTraits: CustomTrait[];
    keyTraits: any[];
    generatingSpeechChatMessageId: any;
    communicationStyle: string;
    useAvvi: boolean;
    elevenLabsVoiceId: any;
    hasPendingAutoSelfiesRequest: boolean;
    uuid: string;
    hasEverEnabledProactiveMessaging: boolean;
    customVoiceId: any;
    voiceSource: string;
    builtInVoiceId: any;
    imageEditRequestUuid: any;
    hasUnreadMedia: boolean;
    optOutRoleplayStarter?: boolean;
    videoRequestUuid?: string;
    baseCharacterImageId?: string;
    baseSelfieImageId?: string;
    removed: boolean;
}

interface Settings2 {
    imageSystem?: number;
    imageFilterSensitivity: string;
    imageStyle: string;
    selfiePhotoSystem: string;
    selfieFaceFidelityRatio: number;
    allowCoupleSelfies: boolean;
    useBetaAi: boolean;
    proactiveNomiMessageFrequency?: string;
    allowAutomaticSelfies: boolean;
    aiSystem: string;
    videoResolution: string;
}

interface ArtSettings2 {
    fidelityWeight: number;
    faceMatch: boolean;
    aspectRatio: string;
    style: string;
    poseReference?: string;
}

interface CustomTrait {
    name: string;
    type: string;
}
