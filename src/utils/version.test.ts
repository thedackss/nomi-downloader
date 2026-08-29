import { describe, expect, it } from "vitest";
import { compareVersions } from "./version";

describe("compareVersions", () => {
    it("returns 0 for equal versions", () => {
        expect(compareVersions("0.4.3", "0.4.3")).toBe(0);
    });

    it("treats missing trailing parts as zero", () => {
        expect(compareVersions("0.4", "0.4.0")).toBe(0);
        expect(compareVersions("1", "1.0.0")).toBe(0);
    });

    it("detects an older version (negative)", () => {
        expect(compareVersions("0.4.2", "0.4.3")).toBeLessThan(0);
        expect(compareVersions("0.4.3", "0.5.0")).toBeLessThan(0);
        expect(compareVersions("0.9.9", "1.0.0")).toBeLessThan(0);
    });

    it("detects a newer version (positive)", () => {
        expect(compareVersions("0.4.4", "0.4.3")).toBeGreaterThan(0);
        expect(compareVersions("1.0.0", "0.9.9")).toBeGreaterThan(0);
    });

    it("compares each segment numerically, not lexically", () => {
        // "10" > "9" numerically, but "10" < "9" as strings.
        expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
    });

    it("tolerates non-numeric junk by treating it as zero", () => {
        expect(compareVersions("0.4.x", "0.4.0")).toBe(0);
    });
});
