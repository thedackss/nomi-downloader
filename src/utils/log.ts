export function Log(text: string) {
    const { MODE } = import.meta.env;

    if (MODE === "development") {
        console.log(`[NomiDownloader] ${text}`);
    }
}
