export function Log(...data: any[]) {
    const { MODE } = import.meta.env;

    if (MODE === "development") {
        console.log(`[NomiDownloader] ${data}`);
    }
}
