import { describe, expect, it } from "vitest";
import { applyMessageRange } from "./messageRange";

describe("applyMessageRange", () => {
    const items = [1, 2, 3, 4, 5];

    it("returns everything when nothing is set", () => {
        expect(applyMessageRange(items)).toEqual([1, 2, 3, 4, 5]);
    });

    it("keeps the last N via maxMessages", () => {
        expect(applyMessageRange(items, 0, 0, 2)).toEqual([4, 5]);
    });

    it("slices an inclusive 1-based range", () => {
        expect(applyMessageRange(items, 2, 4)).toEqual([2, 3, 4]);
    });

    it("treats rangeStart as an open lower bound", () => {
        expect(applyMessageRange(items, 0, 3)).toEqual([1, 2, 3]);
    });

    it("treats rangeEnd as an open upper bound", () => {
        expect(applyMessageRange(items, 3, 0)).toEqual([3, 4, 5]);
    });

    it("lets an explicit range win over maxMessages", () => {
        expect(applyMessageRange(items, 1, 2, 99)).toEqual([1, 2]);
    });

    it("clamps a range that runs past the end", () => {
        expect(applyMessageRange(items, 4, 100)).toEqual([4, 5]);
    });
});
