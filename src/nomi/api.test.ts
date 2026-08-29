import { describe, expect, it } from "vitest";
import { reachesCutoff } from "./api";
import type { Message } from "./types/api.nomis.id.chat";

const msg = (sent: string) => ({ sent }) as Message;

describe("reachesCutoff", () => {
    const cutoff = new Date("2026-06-01T12:00:00Z").getTime();

    it("is false while a page is entirely newer than the cutoff", () => {
        const page = [msg("2026-06-03T00:00:00Z"), msg("2026-06-02T00:00:00Z")];
        expect(reachesCutoff(page, cutoff)).toBe(false);
    });

    it("is true once a page reaches older messages", () => {
        // Pages run newest -> oldest, so the cutoff lands mid-page.
        const page = [msg("2026-06-02T00:00:00Z"), msg("2026-05-30T00:00:00Z")];
        expect(reachesCutoff(page, cutoff)).toBe(true);
    });

    it("is true on an exact timestamp match (already downloaded)", () => {
        expect(reachesCutoff([msg("2026-06-01T12:00:00Z")], cutoff)).toBe(true);
    });

    it("ignores unparsable dates instead of stopping early", () => {
        expect(reachesCutoff([msg("not-a-date")], cutoff)).toBe(false);
    });

    it("is false for an empty page", () => {
        expect(reachesCutoff([], cutoff)).toBe(false);
    });
});
