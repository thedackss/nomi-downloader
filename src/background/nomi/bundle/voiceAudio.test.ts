import { describe, expect, it } from "vitest";
import type {
    Message,
    SelfieRequest,
} from "../../../nomi/types/api.nomis.id.chat";
import {
    voiceAudioPath,
    voiceAudioPathMap,
    voiceMessagesWithAudio,
} from "./voiceAudio";

const voice = (uuid: string, status: string): Message =>
    ({
        uuid,
        sent: "2026-07-23T01:03:05.008Z",
        isVoiceMessage: true,
        speech: {
            status,
            updated: "",
            mimeType: "audio/flac",
            version: 0,
            durationInSeconds: 10,
        },
    }) as Message;

describe("voiceMessagesWithAudio", () => {
    it("keeps only voice messages with completed speech", () => {
        const text = { uuid: "t1", sent: "2026-07-01T00:00:00Z" } as Message;
        const pending = voice("v2", "Pending");
        const done = voice("v1", "Completed");
        const selfie = { id: 9, completed: "2026-07-02" } as SelfieRequest;

        const result = voiceMessagesWithAudio([text, pending, done, selfie]);
        expect(result).toEqual([done]);
    });
});

describe("voiceAudioPath", () => {
    it("builds chronological voice/ paths dated by the message", () => {
        expect(voiceAudioPath(0, "2026-07-23T01:03:05.008Z")).toBe(
            "voice/voice_1_2026-07-23.flac",
        );
        expect(voiceAudioPath(11, "2026-01-02T10:00:00Z")).toBe(
            "voice/voice_12_2026-01-02.flac",
        );
    });

    it("follows the stored mime type — user voice messages are webm", () => {
        expect(
            voiceAudioPath(0, "2026-07-23T01:00:48Z", "audio/webm;codecs=opus"),
        ).toBe("voice/voice_1_2026-07-23.webm");
        expect(voiceAudioPath(1, "2026-07-23T01:03:05Z", "audio/flac")).toBe(
            "voice/voice_2_2026-07-23.flac",
        );
    });
});

describe("voiceAudioPathMap", () => {
    it("maps uuids to chronological paths, skipping non-audio items", () => {
        const withAudio = voice("v1", "Completed");
        const pending = voice("v2", "Pending");
        const map = voiceAudioPathMap([withAudio, pending]);

        expect(map.get("v1")).toBe("voice/voice_1_2026-07-23.flac");
        expect(map.has("v2")).toBe(false);
    });
});
