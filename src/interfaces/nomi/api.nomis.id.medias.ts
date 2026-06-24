export interface APINomisIDMediasResponse {
    maxPages: number;
    page: number;
    medias: Media[];
}

export interface Media {
    mediaType: MediaType;
    id: number | string;
    selfieRequestId?: number;
    hidden: boolean;
    nsfwScore?: number;
    reaction: ReactionClass | ReactionEnum | null;
    feedback?: null | string;
    flagged?: boolean | null;
    completed: Date;
    type?: Type;
    artPrompt?: null | string;
    artSettings?: ArtSettings;
    system?: System;
    nomis?: Nomi[];
    nomiId: number | null;
    groupChatId: number | null;
    groupChatName?: GroupChatName | null;
    userId?: number;
    requested?: Date;
    processing?: Date;
    failed?: null;
    status?: string;
    textPrompt?: string;
    nomiIds?: number[];
    uuid?: string;
    creditUsed?: number;
    resolution?: string;
    selfieImageId?: string;
    characterImageId?: null;
    parentImageEditRequestUuid?: null;
    mediaTagIds?: unknown[];
    memory?: null;
    selfieType?: Type;
    requestedFrom?: string;
    characterId?: null;
    error?: null;
}

export interface ArtSettings {
    fidelityWeight: null;
    faceMatch: null;
    aspectRatio: AspectRatio | null;
    style: Style | null;
    poseReference: null;
}

export enum AspectRatio {
    Horizontal = "horizontal",
    Vertical = "vertical",
}

export enum Style {
    Realistic = "Realistic",
}

export enum GroupChatName {
    MyaExplores = "Mya Explores",
    The500MessagesGroup = "500+ Messages Group",
}

export enum MediaType {
    ImageEditRequest = "ImageEditRequest",
    Selfie = "Selfie",
    VideoRequest = "VideoRequest",
}

export interface Nomi {
    nomiName: NomiName;
    nomiId: number;
    artPrompt: string;
    faceFidelityRatio: number;
}

export enum NomiName {
    Eleanor = "Eleanor",
    Lexi = "Lexi",
    Melissa = "Melissa",
    Mya = "Mya",
}

export interface ReactionClass {
    type: null;
    feedback: null;
    flagged: null;
}

export enum ReactionEnum {
    Dislike = "Dislike",
    Like = "Like",
}

export enum Type {
    Art = "Art",
    Photo = "Photo",
}

export enum System {
    GroupPhotosV3 = "group-photos-v3",
    GroupPhotosV4 = "group-photos-v4",
    PhotosV3 = "photos-v3",
    PhotosV4 = "photos-v4",
}
