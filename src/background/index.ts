import type { DownloadStatus } from "../popup/components/Info/interfaces";
import { Log, setDebugLogging } from "../utils/log";
import { Nomi } from "./nomi/index";

const nomi = new Nomi();

let downloadStatus: DownloadStatus = {
    inProgress: false,
    message: "You shouldn't be able to see this message",
    id: null,
    type: null,
};

function updateDownloadStatus(status: DownloadStatus) {
    downloadStatus = status;
    chrome.runtime
        .sendMessage({
            type: "DOWNLOAD_STATUS_UPDATE",
            status,
        })
        .catch(() => {});
}

type ProgressFn = (message: string) => void;

/**
 * Shared lifecycle for every download: guards against concurrent downloads,
 * publishes start/done/error status, and exposes a progress callback to the work.
 */
async function runDownload(
    nomiId: number,
    messages: { start: string; done: string; error: string },
    work: (onProgress: ProgressFn) => Promise<void>,
) {
    if (downloadStatus.inProgress) {
        Log("Already downloading");
        return;
    }

    const setNomiStatus = (message: string) =>
        updateDownloadStatus({
            inProgress: true,
            message,
            id: nomiId,
            type: "nomi",
        });

    const setIdleStatus = (message: string) =>
        updateDownloadStatus({
            inProgress: false,
            message,
            id: null,
            type: null,
        });

    setNomiStatus(messages.start);

    try {
        await work(setNomiStatus);
        setIdleStatus(messages.done);
    } catch (error) {
        Log(messages.error, error);
        setIdleStatus(messages.error);
    }
}

/** Build and save a Nomi's mind map as HTML. Returns false if none exists. */
function downloadMindMap(nomiId: number): Promise<boolean> {
    return nomi.downloadMindMap({ nomiId });
}

function main() {
    Log("Extension initialized");

    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
        if (message.type === "GET_DOWNLOAD_STATUS") {
            sendResponse(downloadStatus);
            return;
        }

        const { nomiId } = message.data;
        setDebugLogging(message.data.debug ?? false);

        switch (message.type) {
            case "DOWNLOAD_ALBUM": {
                const {
                    downloadQuantity,
                    folderization,
                    quality,
                    imagesPerZip,
                } = message.data;
                runDownload(
                    nomiId,
                    {
                        start: "Starting download...",
                        done: "Album downloaded!",
                        error: "Error downloading album",
                    },
                    (onProgress) =>
                        nomi.downloadAlbum({
                            nomiId,
                            downloadQuantity,
                            folderization,
                            quality,
                            imagesPerZip,
                            onProgress,
                        }),
                );
                break;
            }
            case "DOWNLOAD_CHAT": {
                const { maxMessages, includeSelfies } = message.data;
                runDownload(
                    nomiId,
                    {
                        start: "Starting download...",
                        done: "Chat downloaded!",
                        error: "Error downloading chat",
                    },
                    (onProgress) =>
                        nomi.downloadChat({
                            nomiId,
                            includeSelfies: includeSelfies ?? true,
                            maxMessages,
                            onProgress,
                        }),
                );
                break;
            }
            case "DOWNLOAD_MIND": {
                runDownload(
                    nomiId,
                    {
                        start: "Starting mind download...",
                        done: "Mind downloaded!",
                        error: "Error downloading mind",
                    },
                    async () => {
                        const ok = await downloadMindMap(nomiId);
                        if (!ok) throw new Error("No mind map data found");
                    },
                );
                break;
            }
            case "DOWNLOAD_BACKSTORY": {
                runDownload(
                    nomiId,
                    {
                        start: "Preparing shared notes...",
                        done: "Shared notes downloaded!",
                        error: "Error downloading shared notes",
                    },
                    async () => {
                        const ok = await nomi.downloadSharedNotes({ nomiId });
                        if (!ok) throw new Error("No shared notes found");
                    },
                );
                break;
            }
            case "DOWNLOAD_JSON": {
                const rawData = message.data?.rawData === true;
                runDownload(
                    nomiId,
                    {
                        start: "Starting JSON download...",
                        done: "JSON downloaded!",
                        error: "Error downloading JSON",
                    },
                    () => nomi.downloadJson({ nomiId }, rawData),
                );
                break;
            }
            case "DOWNLOAD_ALL": {
                const {
                    downloadQuantity,
                    folderization,
                    quality,
                    imagesPerZip,
                    maxMessages,
                    includeSelfies,
                    rawData: allRawData,
                } = message.data;
                runDownload(
                    nomiId,
                    {
                        start: "Starting download...",
                        done: "All downloads complete!",
                        error: "Error during download",
                    },
                    async (onProgress) => {
                        // Best-effort: each step reports its own progress; album
                        // and chat swallow their own errors, mind/json are wrapped.
                        onProgress("Downloading album...");
                        await nomi.downloadAlbum({
                            nomiId,
                            downloadQuantity,
                            folderization,
                            quality,
                            imagesPerZip,
                            onProgress,
                        });

                        onProgress("Downloading chat...");
                        await nomi.downloadChat({
                            nomiId,
                            includeSelfies: includeSelfies ?? true,
                            maxMessages,
                            onProgress,
                        });

                        try {
                            onProgress("Downloading mind map...");
                            await downloadMindMap(nomiId);
                        } catch (err) {
                            Log("Mind map step failed", err);
                        }

                        try {
                            onProgress("Downloading JSON...");
                            await nomi.downloadJson(
                                { nomiId },
                                allRawData === true,
                            );
                        } catch (err) {
                            Log("JSON step failed", err);
                        }
                    },
                );
                break;
            }
        }
    });
}
main();
