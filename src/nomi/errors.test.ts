import { describe, expect, it } from "vitest";
import { NomiError, isSessionExpired } from "./errors";

describe("isSessionExpired", () => {
    it("recognizes a NomiError carrying a 401 status", () => {
        expect(
            isSessionExpired(new NomiError({ message: "x", status: 401 })),
        ).toBe(true);
        expect(
            isSessionExpired(new NomiError({ message: "x", status: 404 })),
        ).toBe(false);
    });

    it("recognizes the (HTTP 401) suffix describeError adds", () => {
        expect(
            isSessionExpired(
                new NomiError({
                    message: "Failed to get Nomi with ID 1 (HTTP 401)",
                }),
            ),
        ).toBe(true);
        expect(
            isSessionExpired(new Error("Failed to get Nomi (HTTP 500)")),
        ).toBe(false);
    });

    it("recognizes a raw axios-style 401", () => {
        expect(isSessionExpired({ response: { status: 401 } })).toBe(true);
        expect(isSessionExpired({ response: { status: 403 } })).toBe(false);
        expect(isSessionExpired(undefined)).toBe(false);
    });
});
