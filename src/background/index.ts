import type { DownloadStatus } from "../popup/components/Info/interfaces";
import { Log } from "../utils/log";
import { generateMindMapHtml } from "../utils/mindMapHtml";
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

function main() {
    Log("Extension initialized");

    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
        if (message.type === "GET_DOWNLOAD_STATUS") {
            sendResponse(downloadStatus);
            return;
        }

        const { nomiId } = message.data;

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
                const { maxMessages } = message.data;
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
                            includeSelfies: true,
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
                        const data = await nomi.getMindInfo({ nomiId });
                        if (!data) throw new Error("No mind map data found");

                        const htmlContent = generateMindMapHtml(data);
                        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

                        await chrome.downloads.download({
                            url: dataUrl,
                            filename: `mind-map-${nomiId}-${Date.now()}.html`,
                            saveAs: true,
                        });
                    },
                );
                break;
            }
            case "DOWNLOAD_BACKSTORY": {
                runDownload(
                    nomiId,
                    {
                        start: "Preparing backstory...",
                        // Not implemented yet — report honestly, don't fake success.
                        done: "Backstory export isn't available yet",
                        error: "Backstory export isn't available yet",
                    },
                    async () => {},
                );
                break;
            }
            case "DOWNLOAD_JSON": {
                runDownload(
                    nomiId,
                    {
                        start: "Starting JSON download...",
                        done: "JSON downloaded!",
                        error: "Error downloading JSON",
                    },
                    async () => {
                        const data = await nomi.get({ nomiId });
                        const json = JSON.stringify(data, null, 2);
                        const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;

                        await chrome.downloads.download({
                            url: dataUrl,
                            filename: `nomi-${nomiId}-${Date.now()}.json`,
                            saveAs: true,
                        });
                    },
                );
                break;
            }
        }
    });
}
main();
