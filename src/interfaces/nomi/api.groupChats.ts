export interface ApiGroupChatsResponse {
    groupChats: GroupChat[];
}

export interface GroupChat {
    id:                                 number;
    userId:                             number;
    name:                               string;
    status:                             Status;
    nextSpeakerNomiId:                  null;
    deleted:                            null;
    updated:                            Date;
    created:                            Date;
    backchannelingEnabled:              boolean;
    artSettings:                        GroupChatArtSettings;
    settings:                           GroupChatSettings;
    type:                               string;
    uuid:                               string;
    generatingSpeechGroupChatMessageId: null;
    mostRecentMessage:                  MostRecentMessage;
    note:                               Note;
    messageDraft:                       string;
    hasActiveArtRequest:                boolean;
    nomis:                              Nomi[];
    socketToken:                        string;
}

export interface GroupChatArtSettings {
    aspectRatio: null;
    imageStyle:  ImageStyle;
}

export enum ImageStyle {
    Anime = "Anime",
    Realistic = "Realistic",
}

export interface MostRecentMessage {
    uuid: string;
    text: string;
    sent: Date;
}

export interface Nomi {
    id:                               number;
    userId:                           number;
    name:                             string;
    gender:                           Gender;
    created:                          Date;
    updated:                          Date;
    relationshipType:                 RelationshipType;
    archived:                         Date | null;
    status:                           Status;
    characterId:                      string;
    pictureImageId:                   string;
    pictureSelfieImageId:             null | string;
    settings:                         NomiSettings;
    artSettings:                      NomiArtSettings;
    customTraits:                     CustomTrait[];
    keyTraits:                        any[];
    generatingSpeechChatMessageId:    null;
    communicationStyle:               Status;
    useAvvi:                          boolean;
    elevenLabsVoiceId:                null;
    hasPendingAutoSelfiesRequest:     boolean;
    uuid:                             string;
    hasEverEnabledProactiveMessaging: boolean;
    customVoiceId:                    null;
    voiceSource:                      VoiceSource;
    builtInVoiceId:                   null;
    imageEditRequestUuid:             null;
    hasUnreadMedia:                   boolean;
    optOutRoleplayStarter:            boolean | null;
    videoRequestUuid:                 null | string;
    baseCharacterImageId:             null | string;
    baseSelfieImageId:                null | string;
    baseImageEditRequestUuid:         null;
    removed:                          boolean;
}

export interface NomiArtSettings {
    fidelityWeight:     number;
    faceMatch:          boolean;
    aspectRatio:        AspectRatio;
    style:              Style;
    poseReference:      null | string;
    nomiAnchorLookUuid: null;
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

export enum Status {
    Default = "Default",
    Descriptive = "Descriptive",
}

export interface CustomTrait {
    name: string;
    type: string;
}

export enum Gender {
    Female = "Female",
    Male = "Male",
}

export enum RelationshipType {
    Friend = "Friend",
    Roleplay = "Roleplay",
}

export interface NomiSettings {
    imageSystem:                   number | null;
    imageFilterSensitivity:        ImageFilterSensitivity;
    imageStyle:                    ImageStyle;
    selfiePhotoSystem:             SelfiePhotoSystem;
    selfieFaceFidelityRatio:       number;
    allowCoupleSelfies:            boolean;
    useBetaAi:                     boolean;
    proactiveNomiMessageFrequency: null | string;
    allowAutomaticSelfies:         boolean;
    aiSystem:                      AISystem;
    videoResolution:               VideoResolution;
    nomiAnchorLookUuid:            null;
}

export enum AISystem {
    Solstice = "Solstice",
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

export interface Note {
    draft:          string;
    text:           string;
    status:         Status;
    roleplay:       string;
    roleplayDraft:  string;
    roleplayStatus: Status;
}

export interface GroupChatSettings {
    imageSystem:     number;
    imageStyle:      ImageStyle;
    videoResolution: VideoResolution;
}
