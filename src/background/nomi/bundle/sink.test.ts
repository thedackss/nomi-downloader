import { describe, expect, it } from "vitest";
import type { OffscreenClient } from "../offscreenClient";
import { BundleSink } from "./sink";

/**
 * An offscreen stand-in that records zip operations and, like the real one,
 * resolves asynchronously, so concurrent callers really interleave.
 */
function fakeOffscreen() {
    const zips = new Map<string, string[]>();
    const client = {
        async call(action: string, args: Record<string, unknown>) {
            await new Promise((r) => setTimeout(r, 1));
            const id = String(args.id);
            if (action === "create-zip") zips.set(id, []);
            if (action === "add-file") zips.get(id)?.push(String(args.path));
            if (action === "generate-zip") {
                return { success: true, url: `blob:${id}` };
            }
            return {};
        },
    } as unknown as OffscreenClient;
    return { client, zips };
}

const b64 = (bytes: number) => "A".repeat(Math.ceil(bytes / 0.75));

describe("BundleSink", () => {
    it("creates one part when concurrent writers start on an empty sink", async () => {
        const { client, zips } = fakeOffscreen();
        const sink = new BundleSink(client, 750 * 1024 * 1024);

        // Two album workers racing on the very first files.
        await Promise.all([
            sink.addFile("album/a.webp", b64(1000)),
            sink.addFile("album/b.webp", b64(1000)),
            sink.addFile("album/c.webp", b64(1000)),
        ]);
        await sink.addText("index.html", "<html/>", true);

        const downloads = await sink.finalize("Nomi_Test");
        expect(zips.size).toBe(1);
        expect(downloads).toHaveLength(1);
        expect(downloads[0].filename).toBe("Nomi_Test.zip");
        expect([...zips.values()][0]).toHaveLength(4);
    });

    it("rolls into a second part at the size cap, never leaving one empty", async () => {
        const { client, zips } = fakeOffscreen();
        const sink = new BundleSink(client, 2500);

        await sink.addFile("one.bin", b64(1000));
        await sink.addFile("two.bin", b64(1000));
        await sink.addFile("three.bin", b64(1000)); // 3000 > 2500 → part 2
        await sink.addText("index.html", "x", true); // pinned to part 1

        const downloads = await sink.finalize("Nomi_Test");
        expect(zips.size).toBe(2);
        expect(downloads.map((d) => d.filename)).toEqual([
            "Nomi_Test_Part1.zip",
            "Nomi_Test_Part2.zip",
        ]);
        const [first, second] = [...zips.values()];
        expect(first).toEqual(["one.bin", "two.bin", "index.html"]);
        expect(second).toEqual(["three.bin"]);
    });

    it("keeps concurrent writers from both slipping past the cap", async () => {
        const { client, zips } = fakeOffscreen();
        const sink = new BundleSink(client, 2500);

        await sink.addFile("seed.bin", b64(1000));
        // Both would fit alone (2000 ≤ 2500) but not together (3000).
        await Promise.all([
            sink.addFile("x.bin", b64(1000)),
            sink.addFile("y.bin", b64(1000)),
        ]);

        await sink.finalize("Nomi_Test");
        const sizes = [...zips.values()].map((files) => files.length);
        expect(zips.size).toBe(2);
        expect(sizes.sort()).toEqual([1, 2]);
    });
});
