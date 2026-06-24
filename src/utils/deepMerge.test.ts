import { describe, expect, it } from "vitest";
import { deepMerge } from "./deepMerge";

describe("deepMerge", () => {
    it("overlays source scalars onto target", () => {
        expect(deepMerge({ a: 1, b: 2 }, { b: 3 })).toEqual({ a: 1, b: 3 });
    });

    it("merges nested objects recursively", () => {
        const target = { list: { iconSize: "medium", iconShape: "square" } };
        const source = { list: { iconSize: "large" } };

        expect(deepMerge(target, source)).toEqual({
            list: { iconSize: "large", iconShape: "square" },
        });
    });

    it("keeps target keys missing from source (new defaults survive)", () => {
        const defaults = { a: 1, nested: { x: 1, y: 2 } };
        const stored = { a: 9, nested: { x: 5 } };

        expect(deepMerge(defaults, stored)).toEqual({
            a: 9,
            nested: { x: 5, y: 2 },
        });
    });

    it("replaces arrays wholesale rather than merging them", () => {
        expect(deepMerge({ tags: [1, 2, 3] }, { tags: [9] })).toEqual({
            tags: [9],
        });
    });

    it("does not mutate the target", () => {
        const target = { nested: { x: 1 } };
        deepMerge(target, { nested: { x: 2 } });
        expect(target.nested.x).toBe(1);
    });

    it("returns source when types are not both objects", () => {
        expect(deepMerge<unknown>({ a: 1 }, 5)).toBe(5);
    });
});
