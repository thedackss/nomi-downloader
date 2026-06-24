import type { CustomTrait } from "./shared";

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
    archived: string | null;
    status: string;
    characterId: string;
    pictureImageId: string;
    pictureSelfieImageId?: string;
    settings: Settings;
    artSettings: ArtSettings;
    customTraits: CustomTrait[];
    keyTraits: string[];
    generatingSpeechChatMessageId: string | null;
    communicationStyle: string;
    useAvvi: boolean;
    elevenLabsVoiceId: string | null;
    hasPendingAutoSelfiesRequest: boolean;
    uuid: string;
    hasEverEnabledProactiveMessaging: boolean;
    customVoiceId: string | null;
    voiceSource: string;
    builtInVoiceId: string | null;
    imageEditRequestUuid: string | null;
    hasUnreadMedia: boolean;
    optOutRoleplayStarter?: boolean;
    videoRequestUuid?: string;
    baseCharacterImageId?: string;
    baseSelfieImageId?: string;
    lastVisibleMessage: LastVisibleMessage;
    hasActiveArtRequest: boolean;
    hasActiveVideoRequest: boolean;
    unreadNomiMessageUuids: string[];
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
    proactiveNomiMessageFrequency: string | null;
    allowAutomaticSelfies: boolean;
    aiSystem: string;
    videoResolution: string;
}

interface ArtSettings {
    fidelityWeight: number;
    faceMatch: boolean;
    aspectRatio: string;
    style: string;
    poseReference: string | null;
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
