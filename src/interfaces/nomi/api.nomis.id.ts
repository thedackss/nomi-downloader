export interface ApiNomisIdResponse {
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
    pictureSelfieImageId: string;
    settings: Settings;
    artSettings: ArtSettings;
    customTraits: any[];
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
    optOutRoleplayStarter: any;
    videoRequestUuid: any;
    baseCharacterImageId: any;
    baseSelfieImageId: string;
    traits: any[];
    messageDraft: string;
    unreadNomiMessageUuids: any[];
    videoRequestCompleted: any;
    socketToken: string;
    inService: boolean;
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
