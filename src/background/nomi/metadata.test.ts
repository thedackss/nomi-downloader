import { describe, expect, it } from "vitest";
import { bytesToBase64, embedPrompt, textToBase64 } from "./metadata";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Minimal-but-valid PNG: signature + IHDR + IEND. */
function makePng(): Uint8Array {
    const ihdrData = new Uint8Array(13); // zeros are fine for a structural test
    const ihdr = chunk("IHDR", ihdrData);
    const iend = chunk("IEND", new Uint8Array(0));
    return concat(new Uint8Array(PNG_SIGNATURE), ihdr, iend);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
    const typeBytes = Uint8Array.from(type, (c) => c.charCodeAt(0));
    const out = new Uint8Array(12 + data.length);
    new DataView(out.buffer).setUint32(0, data.length);
    out.set(typeBytes, 4);
    out.set(data, 8);
    // CRC is unchecked by the parser below, so leave it zero.
    return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const p of parts) {
        out.set(p, off);
        off += p.length;
    }
    return out;
}

/** Walk PNG chunks, returning [type, dataBytes] pairs. */
function readChunks(bytes: Uint8Array): Array<[string, Uint8Array]> {
    const out: Array<[string, Uint8Array]> = [];
    let off = 8;
    while (off + 12 <= bytes.length) {
        const len = new DataView(bytes.buffer, bytes.byteOffset).getUint32(off);
        const type = String.fromCharCode(...bytes.subarray(off + 4, off + 8));
        const data = bytes.subarray(off + 8, off + 8 + len);
        out.push([type, data]);
        off += 12 + len;
    }
    return out;
}

describe("bytesToBase64 / textToBase64", () => {
    it("round-trips text through base64", () => {
        const text = "Lago, baddie milf — café ☕";
        const b64 = textToBase64(text);
        const decoded = new TextDecoder().decode(
            Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)),
        );
        expect(decoded).toBe(text);
    });

    it("encodes large byte arrays without overflowing the spread", () => {
        const big = new Uint8Array(100_000).fill(65);
        expect(bytesToBase64(big)).toBe(btoa("A".repeat(100_000)));
    });
});

describe("embedPrompt", () => {
    it("inserts an iTXt chunk before IEND in a PNG", () => {
        const png = makePng();
        const out = embedPrompt(png, "png", "a young woman in a red dress");
        expect(out).not.toBeNull();
        if (!out) return;

        const chunks = readChunks(out);
        const types = chunks.map(([t]) => t);
        expect(types).toEqual(["IHDR", "iTXt", "IEND"]);

        const itxt = chunks.find(([t]) => t === "iTXt");
        if (!itxt) throw new Error("no iTXt");
        const text = new TextDecoder().decode(itxt[1]);
        expect(text.startsWith("Description\0")).toBe(true);
        expect(text.endsWith("a young woman in a red dress")).toBe(true);
    });

    it("keeps IEND last after embedding", () => {
        const out = embedPrompt(makePng(), "png", "hello");
        if (!out) throw new Error("null");
        const chunks = readChunks(out);
        expect(chunks.at(-1)?.[0]).toBe("IEND");
    });

    it("returns null for webp (caller falls back to a sidecar)", () => {
        expect(embedPrompt(makePng(), "webp", "x")).toBeNull();
    });

    it("returns null for non-PNG bytes", () => {
        expect(
            embedPrompt(new Uint8Array([1, 2, 3, 4]), "png", "x"),
        ).toBeNull();
    });
});
