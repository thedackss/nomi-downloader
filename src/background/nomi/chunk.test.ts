import { describe, expect, it } from "vitest";
import { chunkBySize } from "./chunk";

describe("chunkBySize", () => {
    const size = (n: number) => n;

    it("keeps items in one chunk when under the limit", () => {
        expect(chunkBySize([1, 2, 3], size, 10)).toEqual([[1, 2, 3]]);
    });

    it("starts a new chunk when the next item would exceed the limit", () => {
        expect(chunkBySize([6, 6, 6], size, 10)).toEqual([[6], [6], [6]]);
    });

    it("packs greedily up to the limit", () => {
        expect(chunkBySize([4, 4, 4, 4], size, 10)).toEqual([
            [4, 4],
            [4, 4],
        ]);
    });

    it("gives a single oversized item its own chunk", () => {
        expect(chunkBySize([20, 1], size, 10)).toEqual([[20], [1]]);
    });

    it("returns an empty array for no items", () => {
        expect(chunkBySize([], size, 10)).toEqual([]);
    });

    it("caps a chunk by count when maxCountPerChunk is set", () => {
        // Bytes alone would keep all 5 in one chunk (size 1 each, cap 100),
        // but the count cap of 2 forces 2 / 2 / 1.
        expect(chunkBySize([1, 1, 1, 1, 1], size, 100, 2)).toEqual([
            [1, 1],
            [1, 1],
            [1],
        ]);
    });

    it("closes on whichever limit hits first (bytes or count)", () => {
        // Count cap is 5, but the byte cap of 10 closes after two 6s... no:
        // 6 alone fills past nothing; 6+6>10 so byte cap splits first.
        expect(chunkBySize([6, 6, 6], size, 10, 5)).toEqual([[6], [6], [6]]);
    });
});
