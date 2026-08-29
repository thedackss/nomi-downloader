import { api } from "../../../nomi/http";
import type {
    Message,
    SelfieRequest,
} from "../../../nomi/types/api.nomis.id.chat";
import { Log } from "../../../utils/log";
import { MEDIA_DOWNLOAD_TIMEOUT_MS } from "../constants";
import type { OffscreenClient } from "../offscreenClient";

/**
 * Voice messages whose audio is stored server-side and downloadable.
 * `recentLimit` keeps only the most recent N (0 = all) — like the album's
 * "most recent photos" cap, since audio files are large.
 */
export function voiceMessagesWithAudio(
    items: (Message | SelfieRequest)[],
    recentLimit = 0,
): Message[] {
    const messages = items.filter(
        (item): item is Message =>
            "sent" in item &&
            item.isVoiceMessage &&
            item.speech?.status === "Completed",
    );
    return recentLimit > 0 ? messages.slice(-recentLimit) : messages;
}

/**
 * File extension for a voice message's audio. Nomi TTS replies are stored as
 * flac; user-sent voice messages as webm/opus. The server ignores the
 * extension in the URL and always serves the stored format, so the saved
 * name must follow the mime type or local playback breaks.
 */
export function voiceAudioExt(mimeType: string | undefined): string {
    if (mimeType?.includes("webm")) return "webm";
    if (mimeType?.includes("ogg")) return "ogg";
    return "flac";
}

/** In-bundle path for a voice message's audio, chronological by index. */
export function voiceAudioPath(
    index: number,
    sent: string,
    mimeType?: string,
): string {
    const date = new Date(sent).toISOString().split("T")[0];
    return `voice/voice_${index + 1}_${date}.${voiceAudioExt(mimeType)}`;
}

/**
 * Chronological map of message uuid → in-export audio path for every voice
 * message with stored audio. Shared by the chat HTML (audio players) and the
 * fetcher so the referenced paths always match the saved files.
 */
export function voiceAudioPathMap(
    items: (Message | SelfieRequest)[],
    recentLimit = 0,
): Map<string, string> {
    const map = new Map<string, string>();
    voiceMessagesWithAudio(items, recentLimit).forEach((message, i) => {
        map.set(
            message.uuid,
            voiceAudioPath(i, message.sent, message.speech?.mimeType),
        );
    });
    return map;
}

/**
 * Download each voice message's stored audio into `put` under the paths from
 * voiceAudioPathMap. Failures skip the file (the transcript is in the chat
 * anyway). Returns the paths that made it in, chronological.
 */
export async function fetchVoiceAudio({
    nomiId,
    items,
    put,
    offscreen,
    onProgress,
    recentLimit = 0,
}: {
    nomiId: number;
    items: (Message | SelfieRequest)[];
    put: (path: string, base64: string) => Promise<unknown>;
    offscreen: OffscreenClient;
    onProgress?: (message: string) => void;
    /** Keep only the most recent N audios; 0 = all. */
    recentLimit?: number;
}): Promise<string[]> {
    const messages = voiceMessagesWithAudio(items, recentLimit);
    const paths = voiceAudioPathMap(items, recentLimit);
    const added: string[] = [];

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const path = paths.get(message.uuid);
        if (!path) continue;
        onProgress?.(`Downloading voice audio ${i + 1}/${messages.length}…`);
        try {
            const ext = voiceAudioExt(message.speech?.mimeType);
            const { data } = await api.get(
                `/nomis/${nomiId}/chat/messages/${message.uuid}/speech.${ext}`,
                { responseType: "blob", timeout: MEDIA_DOWNLOAD_TIMEOUT_MS },
            );
            const base64 = await offscreen.blobToBase64(data);
            await put(path, base64);
            added.push(path);
        } catch (error) {
            Log(`Failed to fetch voice audio for ${message.uuid}`, error);
        }
    }

    return added;
}
