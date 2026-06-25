// Shared types for the nomi.ai group-chat API responses. Both the list
// (/group-chats) and single (/group-chats/:id) endpoints return the same
// underlying shapes, so they live here and are imported by both.

export enum Gender {
    Female = "Female",
    Male = "Male",
}

export enum Status {
    Default = "Default",
    Descriptive = "Descriptive",
}

export enum RelationshipType {
    Friend = "Friend",
    Roleplay = "Roleplay",
}

export enum AspectRatio {
    Horizontal = "horizontal",
    Square = "square",
    Vertical = "vertical",
}

export enum Style {
    Artistic = "Artistic",
    Realistic = "Realistic",
}

export enum ImageStyle {
    Anime = "Anime",
    Artistic = "Artistic",
    Realistic = "Realistic",
}

export enum ImageFilterSensitivity {
    Moderate = "Moderate",
}

export enum SelfiePhotoSystem {
    PhotosV3 = "photos-v3",
    PhotosV4 = "photos-v4",
}

export enum VideoResolution {
    HD = "hd",
    SD = "sd",
}

export enum VoiceSource {
    BuiltIn = "BuiltIn",
}

export enum AISystem {
    Solstice = "Solstice",
}

export interface MostRecentMessage {
    uuid: string;
    text: string;
    sent: Date;
}

export interface CustomTrait {
    name: string;
    type: string;
}

export interface NomiSettings {
    imageSystem: number | null;
    imageFilterSensitivity: ImageFilterSensitivity;
    imageStyle: ImageStyle;
    selfiePhotoSystem: SelfiePhotoSystem;
    selfieFaceFidelityRatio: number;
    allowCoupleSelfies: boolean;
    useBetaAi: boolean;
    proactiveNomiMessageFrequency: null | string;
    allowAutomaticSelfies: boolean;
    aiSystem: AISystem;
    videoResolution: VideoResolution;
    nomiAnchorLookUuid: null;
}

export interface NomiArtSettings {
    fidelityWeight: number;
    faceMatch: boolean;
    aspectRatio: AspectRatio;
    style: Style;
    poseReference: null | string;
    nomiAnchorLookUuid: null;
}

export interface Note {
    draft: string;
    text: string;
    status: Status;
    roleplay: string;
    roleplayDraft: string;
    roleplayStatus: Status;
}

export interface GroupArtSettings {
    aspectRatio: null;
    imageStyle: ImageStyle;
}

export interface GroupSettings {
    imageSystem: number;
    imageStyle: ImageStyle;
    videoResolution: VideoResolution;
}

export interface GroupNomi {
    id: number;
    userId: number;
    name: string;
    gender: Gender;
    created: Date;
    updated: Date;
    relationshipType: RelationshipType;
    archived: Date | null;
    status: Status;
    characterId: string;
    pictureImageId: string;
    pictureSelfieImageId: null | string;
    settings: NomiSettings;
    artSettings: NomiArtSettings;
    customTraits: CustomTrait[];
    keyTraits: string[];
    generatingSpeechChatMessageId: null;
    communicationStyle: Status;
    useAvvi: boolean;
    elevenLabsVoiceId: null;
    hasPendingAutoSelfiesRequest: boolean;
    uuid: string;
    hasEverEnabledProactiveMessaging: boolean;
    customVoiceId: null;
    voiceSource: VoiceSource;
    builtInVoiceId: null;
    imageEditRequestUuid: null;
    hasUnreadMedia: boolean;
    optOutRoleplayStarter: boolean | null;
    videoRequestUuid: null | string;
    baseCharacterImageId: null | string;
    baseSelfieImageId: null | string;
    baseImageEditRequestUuid: null;
    removed: boolean;
}
