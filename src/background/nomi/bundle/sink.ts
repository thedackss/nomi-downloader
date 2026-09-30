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

    /**
     * Writers run concurrently (the album uses several workers), but choosing
     * or creating a part must not: two writers racing on an empty sink would
     * each create a "first" part, and possibly with the same id. This chain
     * serializes the pick-or-create step; the actual file add still overlaps.
     */
    private placing: Promise<unknown> = Promise.resolve();
    private created = 0;

    constructor(
        private readonly offscreen: OffscreenClient,
        private readonly maxBytes: number,
    ) {}

    /** Every file added so far, across all parts, in insertion order. */
    entries(): BundleEntry[] {
        return this.parts.flatMap((p) => p.entries);
    }

    /** Run `fn` after every earlier placement has settled. */
    private serialize<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.placing.then(fn, fn);
        this.placing = run.catch(() => {});
        return run;
    }

    private async part(index: number) {
        while (this.parts.length <= index) {
            this.created += 1;
            const id = `bundle_${this.created}_${Date.now()}`;
            await this.offscreen.call("create-zip", { id });
            this.parts.push({ id, entries: [], bytes: 0 });
        }
        return this.parts[index];
    }

    /**
     * Pick the part a file of `bytes` goes into, rolling into a new one at
     * the size cap; the size is reserved here, under the lock, so concurrent
     * writers cannot both squeeze past the cap.
     */
    private place(path: string, bytes: number) {
        return this.serialize(async () => {
            let index = Math.max(0, this.parts.length - 1);
            const current = await this.part(index);
            // Never leave a part empty, so a single oversized file still
            // gets packaged.
            if (
                current.entries.length > 0 &&
                current.bytes + bytes > this.maxBytes
            ) {
                index++;
            }
            const target = await this.part(index);
            target.entries.push({ path, bytes });
            target.bytes += bytes;
            return target;
        });
    }

    async addFile(path: string, base64: string): Promise<void> {
        const bytes = Math.ceil(base64.length * 0.75);
        const target = await this.place(path, bytes);
        await this.offscreen.call("add-file", {
            id: target.id,
            path,
            content: base64,
        });
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

        const bytes = Math.ceil(base64.length * 0.75);
        const target = await this.serialize(async () => {
            const first = await this.part(0);
            first.entries.push({ path, bytes });
            first.bytes += bytes;
            return first;
        });
        await this.offscreen.call("add-file", {
            id: target.id,
            path,
            content: base64,
        });
    }

    /** Generate every non-empty part; returns the downloads in part order. */
    async finalize(
        baseName: string,
    ): Promise<{ url: string; filename: string }[]> {
        const downloads: { url: string; filename: string }[] = [];
        const filled = this.parts.filter((p) => p.entries.length > 0);
        Log(
            `Bundle: ${filled.length} part(s): ` +
                filled
                    .map(
                        (p, i) =>
                            `#${i + 1} ${p.entries.length} files ~${(p.bytes / 1e6).toFixed(1)} MB`,
                    )
                    .join(", "),
        );

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
