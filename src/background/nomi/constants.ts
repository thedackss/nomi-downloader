const MB = 1024 * 1024;

/** Offscreen document that hosts JSZip / Blob work in MV3. */
export const OFFSCREEN_DOCUMENT_PATH = "src/offscreen/index.html";

/** Per-zip memory budget so huge albums/chats split across multiple files. */
export const ALBUM_CHUNK_MAX_BYTES = 750 * MB;
export const CHAT_CHUNK_MAX_BYTES_WITH_SELFIES = 75_000_000;
export const CHAT_CHUNK_MAX_BYTES_TEXT = 10_000_000;
/** Per-zip cap when a chat exports as a zip (HTML + voice audio files). */
export const CHAT_ZIP_MAX_BYTES = 750 * MB;

/** Rough per-item size estimates, used only to decide chunk boundaries. */
export const HD_IMAGE_BYTES = 2 * MB;
export const SD_IMAGE_BYTES = 0.1 * MB;
export const VIDEO_BYTES = 5 * MB;
export const DEFAULT_MEDIA_BYTES = 1 * MB;
export const MESSAGE_BYTES = 1500;
export const SELFIE_BYTES = 100_000;

/** Network timeouts for large binary downloads. */
export const MEDIA_DOWNLOAD_TIMEOUT_MS = 60_000;
export const SELFIE_DOWNLOAD_TIMEOUT_MS = 30_000;

/** Pacing to avoid overwhelming chrome.downloads. */
export const DOWNLOAD_THROTTLE_MS = 500;
export const ALBUM_FINALIZE_DELAY_MS = 1_000;
export const BLOB_URL_REVOKE_DELAY_MS = 60_000;

/** Keep a fallback tab's blob URL alive long enough for the user to save it. */
export const FALLBACK_REVOKE_DELAY_MS = 120_000;

/** Default number of media downloaded concurrently per batch. */
export const DEFAULT_DOWNLOAD_QUANTITY = 20;
