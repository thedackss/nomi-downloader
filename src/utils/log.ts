let debugEnabled = false;

/** Enable verbose logging at runtime (e.g. the "Debug mode" setting). */
export function setDebugLogging(enabled: boolean) {
    debugEnabled = enabled;
}

export function Log(...data: unknown[]) {
    const { MODE } = import.meta.env;

    if (MODE === "development" || debugEnabled) {
        console.log("[NomiDownloader]", ...data);
    }
}
