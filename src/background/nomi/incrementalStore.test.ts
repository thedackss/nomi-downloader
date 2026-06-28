import { describe, expect, it } from "vitest";
import { filterNewerThan, newestTimestamp } from "./incrementalStore";

const ts = (s: string) => ({ when: s });
const get = (x: { when: string }) => x.when;

describe("filterNewerThan", () => {
    const items = [
        ts("2024-01-01T00:00:00Z"),
        ts("2024-02-01T00:00:00Z"),
        ts("2024-03-01T00:00:00Z"),
    ];

    it("returns everything without a baseline", () => {
        expect(filterNewerThan(items, get)).toEqual(items);
    });

    it("keeps only items strictly newer than the baseline", () => {
        expect(filterNewerThan(items, get, "2024-02-01T00:00:00Z")).toEqual([
            ts("2024-03-01T00:00:00Z"),
        ]);
    });

    it("returns nothing when the baseline is the newest", () => {
        expect(filterNewerThan(items, get, "2024-03-01T00:00:00Z")).toEqual([]);
    });

    it("ignores an unparseable baseline", () => {
        expect(filterNewerThan(items, get, "not-a-date")).toEqual(items);
    });
});

describe("newestTimestamp", () => {
    it("finds the latest regardless of order", () => {
        const items = [
            ts("2024-03-01T00:00:00Z"),
            ts("2024-01-01T00:00:00Z"),
            ts("2024-02-01T00:00:00Z"),
        ];
        expect(newestTimestamp(items, get)).toBe("2024-03-01T00:00:00Z");
    });

    it("is undefined for an empty list", () => {
        expect(newestTimestamp([], get)).toBeUndefined();
    });
});
