import { describe, expect, it } from "vitest";
import { getNomiImageUrl, getNomiMedia } from "./media";

const API = "https://beta.nomi.ai/api";

describe("getNomiMedia (media item)", () => {
    it("builds the picture from the media item", () => {
        const media = getNomiMedia({
            id: 42,
            pictureMediaItemUuid: "item-uuid",
            pictureMediaItemType: "SelfieImage",
        });

        expect(media).toEqual({
            default: `${API}/media-items/item-uuid/image.webp`,
            video: undefined,
            videoPrev: undefined,
        });
    });

    it("adds the video and its poster for a video profile", () => {
        const media = getNomiMedia({
            id: 42,
            pictureMediaItemUuid: "item-uuid",
            pictureMediaItemType: "Video",
        });

        expect(media.video).toBe(`${API}/media-items/item-uuid/video.mp4`);
        expect(media.videoPrev).toBe(
            `${API}/media-items/item-uuid/image.webp`,
        );
        expect(media.default).toBe(`${API}/media-items/item-uuid/image.webp`);
    });

    it("prefers the media item over legacy ids", () => {
        const media = getNomiMedia({
            id: 42,
            pictureMediaItemUuid: "item-uuid",
            pictureMediaItemType: "EditedImage",
            pictureImageId: "pic1",
            pictureSelfieImageId: "self1",
        });

        expect(media.default).toBe(`${API}/media-items/item-uuid/image.webp`);
        expect(media.selfie).toBeUndefined();
    });

    it("resolves to the media item image through getNomiImageUrl", () => {
        const url = getNomiImageUrl({
            id: 1,
            pictureMediaItemUuid: "item-uuid",
            pictureMediaItemType: "CharacterImage",
        });
        expect(url).toBe(`${API}/media-items/item-uuid/image.webp`);
    });
});

describe("getNomiMedia (legacy ids)", () => {
    it("builds all URLs when every source id is present", () => {
        const media = getNomiMedia({
            id: 42,
            pictureImageId: "pic1",
            pictureSelfieImageId: "self1",
            videoRequestUuid: "vid1",
        });

        expect(media).toEqual({
            default: `${API}/nomis/42/images/pic1.webp`,
            selfie: `${API}/nomis/42/selfies/self1.webp`,
            video: `${API}/video-requests/vid1.mp4`,
            videoPrev: `${API}/video-requests/vid1/preview.webp`,
        });
    });

    it("omits selfie/video when their ids are absent", () => {
        const media = getNomiMedia({ id: 7, pictureImageId: "pic" });

        expect(media.default).toBe(`${API}/nomis/7/images/pic.webp`);
        expect(media.selfie).toBeUndefined();
        expect(media.video).toBeUndefined();
        expect(media.videoPrev).toBeUndefined();
    });

    it("treats null selfie/video ids as absent", () => {
        const media = getNomiMedia({
            id: 9,
            pictureImageId: "pic",
            pictureSelfieImageId: null,
            videoRequestUuid: null,
        });

        expect(media.selfie).toBeUndefined();
        expect(media.video).toBeUndefined();
    });

    it("builds the edit URL from imageEditRequestUuid", () => {
        const media = getNomiMedia({
            id: 5,
            pictureImageId: "pic",
            imageEditRequestUuid: "edit-uuid",
        });

        expect(media.edit).toBe(
            `${API}/image-edit-requests/edit-uuid/edited-image.webp`,
        );
    });
});

describe("getNomiImageUrl", () => {
    it("prefers a custom edit over selfie and default", () => {
        const url = getNomiImageUrl({
            id: 1,
            pictureImageId: "pic",
            pictureSelfieImageId: "self",
            imageEditRequestUuid: "edit-uuid",
        });
        expect(url).toBe(
            `${API}/image-edit-requests/edit-uuid/edited-image.webp`,
        );
    });

    it("prefers the selfie when present", () => {
        const url = getNomiImageUrl({
            id: 1,
            pictureImageId: "pic",
            pictureSelfieImageId: "self",
        });
        expect(url).toBe(`${API}/nomis/1/selfies/self.webp`);
    });

    it("falls back to the default picture without a selfie", () => {
        const url = getNomiImageUrl({ id: 1, pictureImageId: "pic" });
        expect(url).toBe(`${API}/nomis/1/images/pic.webp`);
    });
});
