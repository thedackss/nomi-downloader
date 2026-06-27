// Helpers for attaching a media's generation prompt to its downloaded file:
// either as raw bytes for a sidecar .txt, or embedded into the image itself.
//
// Embedding is only implemented for PNG (the HD format) via an iTXt chunk, which
// is UTF-8 safe and read by common tools as the image Description. WebP and video
// can't carry metadata here, so the caller falls back to a sidecar .txt for them.

/** Base64-encode raw bytes (chunked to stay under the arg-spread limit). */
export function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(
            ...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)),
        );
    }
    return btoa(binary);
}

/** Base64-encode a UTF-8 string (for sidecar .txt content). */
export function textToBase64(text: string): string {
    return bytesToBase64(new TextEncoder().encode(text));
}

/**
 * Embed `text` into the image's metadata. Returns the new bytes, or null when
 * the format can't carry metadata here (WebP, video, anything non-PNG) — the
 * caller should then write a sidecar .txt instead.
 */
export function embedPrompt(
    bytes: Uint8Array,
    ext: string,
    text: string,
): Uint8Array | null {
    if (ext === "png") return embedPng(bytes, text);
    // WebP metadata requires rebuilding the file as VP8X; not worth the
    // corruption risk, so the caller falls back to a sidecar for these.
    return null;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table[n] = c >>> 0;
    }
    return table;
})();

function crc32(bytes: Uint8Array): number {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
        c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = Uint8Array.from(type, (ch) => ch.charCodeAt(0));
    const out = new Uint8Array(12 + data.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, data.length);
    out.set(typeBytes, 4);
    out.set(data, 8);

    const crcInput = new Uint8Array(4 + data.length);
    crcInput.set(typeBytes, 0);
    crcInput.set(data, 4);
    view.setUint32(8 + data.length, crc32(crcInput));
    return out;
}

/** Build an iTXt chunk payload: keyword "Description" + uncompressed UTF-8 text. */
function buildItxt(text: string): Uint8Array {
    const keyword = new TextEncoder().encode("Description");
    const textBytes = new TextEncoder().encode(text);
    // keyword, null sep, compression flag (0), compression method (0),
    // empty language tag + null, empty translated keyword + null, then text.
    const data = new Uint8Array(keyword.length + 5 + textBytes.length);
    let off = 0;
    data.set(keyword, off);
    off += keyword.length;
    data[off++] = 0; // null separator
    data[off++] = 0; // compression flag (uncompressed)
    data[off++] = 0; // compression method
    data[off++] = 0; // language tag (empty) + null
    data[off++] = 0; // translated keyword (empty) + null
    data.set(textBytes, off);
    return data;
}

function embedPng(bytes: Uint8Array, text: string): Uint8Array | null {
    for (let i = 0; i < PNG_SIGNATURE.length; i++) {
        if (bytes[i] !== PNG_SIGNATURE[i]) return null;
    }

    // IEND is always the final 12-byte chunk (length 0 + "IEND" + CRC). Insert
    // the text chunk right before it.
    const iendStart = bytes.length - 12;
    if (iendStart < 8) return null;
    const tag = String.fromCharCode(
        ...bytes.subarray(iendStart + 4, iendStart + 8),
    );
    if (tag !== "IEND") return null;

    const chunk = pngChunk("iTXt", buildItxt(text));
    const out = new Uint8Array(bytes.length + chunk.length);
    out.set(bytes.subarray(0, iendStart), 0);
    out.set(chunk, iendStart);
    out.set(bytes.subarray(iendStart), iendStart + chunk.length);
    return out;
}
