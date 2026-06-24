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
});
