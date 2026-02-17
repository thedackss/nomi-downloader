export interface ApiNomisResponse {
    nomis: Nomi[];
}

export interface Nomi {
    id: number;
    userId: number;
    name: string;
    gender: string;
    created: string;
    updated: string;
    relationshipType: string;
    archived: any;
    status: string;
    characterId: string;
    pictureImageId: string;
    pictureSelfieImageId?: string;
    settings: Settings;
    artSettings: ArtSettings;
    customTraits: any[];
    keyTraits: string[];
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
    lastVisibleMessage: LastVisibleMessage;
    hasActiveArtRequest: boolean;
    hasActiveVideoRequest: boolean;
    unreadNomiMessageUuids: any[];
    videoRequestCompleted?: string;
    traits: Trait[];
}

interface Settings {
    imageSystem: number;
    imageFilterSensitivity: string;
    imageStyle: string;
    selfiePhotoSystem: string;
    selfieFaceFidelityRatio: number;
    allowCoupleSelfies: boolean;
    useBetaAi: boolean;
    proactiveNomiMessageFrequency: any;
    allowAutomaticSelfies: boolean;
    aiSystem: string;
    videoResolution: string;
}

interface ArtSettings {
    fidelityWeight: number;
    faceMatch: boolean;
    aspectRatio: string;
    style: string;
    poseReference: any;
}

interface LastVisibleMessage {
    text: string;
    created: string;
}

interface Trait {
    id: number;
    type: string;
    name: string;
    is18Plus: boolean;
}
