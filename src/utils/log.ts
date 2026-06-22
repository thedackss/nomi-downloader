export function Log(...data: unknown[]) {
    const { MODE } = import.meta.env;

    if (MODE === "development") {
        console.log("[NomiDownloader]", ...data);
    }
}
