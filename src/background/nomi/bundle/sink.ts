import { Log } from "../../../utils/log";
import { textToBase64 } from "../metadata";
import type { OffscreenClient } from "../offscreenClient";

/** Minimal file sink a downloader writes into when bundling. */
export interface BundleFileSink {
    addFile(path: string, base64: string): Promise<void>;
}

export interface BundleEntry {
    path: string;
    bytes: number;
}

/**
 * Collects files into one or more zips held in the offscreen document. Every
 * part stays open until finalize() so late files (the index hub, built from
 * the full file list) can still land in the first part; overflow rolls into
 * _PartN zips. Extracting all parts into one folder recreates a single
 * bundle tree, so relative links keep working across parts.
 */
export class BundleSink {
    private readonly parts: {
        id: string;
        entries: BundleEntry[];
        bytes: number;
    }[] = [];

    constructor(
        private readonly offscreen: OffscreenClient,
        private readonly maxBytes: number,
    ) {}

    /** Every file added so far, across all parts, in insertion order. */
    entries(): BundleEntry[] {
        return this.parts.flatMap((p) => p.entries);
    }

    private async part(index: number) {
        while (this.parts.length <= index) {
            const id = `bundle_${this.parts.length}_${Date.now()}`;
            await this.offscreen.call("create-zip", { id });
            this.parts.push({ id, entries: [], bytes: 0 });
        }
        return this.parts[index];
    }

    async addFile(path: string, base64: string): Promise<void> {
        const bytes = Math.ceil(base64.length * 0.75);

        let index = Math.max(0, this.parts.length - 1);
        const current = await this.part(index);
        // Roll into a new part at the size cap — but never leave a part
        // empty, so a single oversized file still gets packaged.
        if (
            current.entries.length > 0 &&
            current.bytes + bytes > this.maxBytes
        ) {
            index++;
        }

        const target = await this.part(index);
        await this.offscreen.call("add-file", {
            id: target.id,
            path,
            content: base64,
        });
        target.entries.push({ path, bytes });
        target.bytes += bytes;
    }

    /**
     * Add a text file (HTML/JSON). `firstPart` pins it into the first zip
     * regardless of rollover — used for the index hub, which is small and
     * must live next to the docs in part 1.
     */
    async addText(
        path: string,
        text: string,
        firstPart = false,
    ): Promise<void> {
        const base64 = textToBase64(text);
        if (!firstPart) return this.addFile(path, base64);

        const target = await this.part(0);
        await this.offscreen.call("add-file", {
            id: target.id,
            path,
            content: base64,
        });
        const bytes = Math.ceil(base64.length * 0.75);
        target.entries.push({ path, bytes });
        target.bytes += bytes;
    }

    /** Generate every non-empty part; returns the downloads in part order. */
    async finalize(
        baseName: string,
    ): Promise<{ url: string; filename: string }[]> {
        const downloads: { url: string; filename: string }[] = [];
        const filled = this.parts.filter((p) => p.entries.length > 0);

        for (let i = 0; i < filled.length; i++) {
            const part = filled[i];
            const res = await this.offscreen.call("generate-zip", {
                id: part.id,
            });
            if (res.success && res.url) {
                const suffix = filled.length > 1 ? `_Part${i + 1}` : "";
                downloads.push({
                    url: res.url,
                    filename: `${baseName}${suffix}.zip`,
                });
            } else {
                Log(`Failed to generate bundle part ${i + 1}`, res.error);
            }
            await this.offscreen.call("clear-zip", { id: part.id });
        }
        return downloads;
    }
}
