import type { CustomTrait } from "./shared";

export interface ApiNomisIdResponse {
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
    /** The avatar's media item; the only picture reference since 2026-09. */
    pictureMediaItemUuid?: string | null;
    pictureMediaItemType?: string | null;
    /** Legacy, no longer returned by the API. */
    pictureImageId?: string;
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
    optOutRoleplayStarter: boolean | null;
    videoRequestUuid: string | null;
    baseCharacterImageId: string | null;
    baseSelfieImageId: string;
    traits: Trait[];
    messageDraft: string;
    unreadNomiMessageUuids: string[];
    videoRequestCompleted: string | null;
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

interface Trait {
    id: number;
    type: string;
    name: string;
    is18Plus: boolean;
}
