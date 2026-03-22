import type { DownloadStatus } from "../popup/components/Info/interfaces";
import { Log } from "../utils/log";
import { Nomi } from "./nomi/index";
import { generateMindMapHtml } from "../utils/mindMapHtml";

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

async function main() {
    Log("Extension initialized");

    chrome.runtime.onMessage.addListener(async (message, _, sendResponse) => {
        if (message.type === "GET_DOWNLOAD_STATUS") {
            sendResponse(downloadStatus);
        } else if (message.type === "DOWNLOAD_ALBUM") {
            const { nomiId, downloadQuantity, folderization, quality } =
                message.data;

            if (downloadStatus.inProgress) {
                Log("Already downloading");
                return;
            }

            updateDownloadStatus({
                inProgress: true,
                message: "Starting download...",
                id: nomiId,
                type: "nomi",
            });

            await nomi.downloadAlbum({
                nomiId,
                downloadQuantity,
                folderization,
                quality,
                onProgress: (status) => {
                    updateDownloadStatus({
                        inProgress: true,
                        message: status,
                        id: nomiId,
                        type: "nomi",
                    });
                },
            });

            updateDownloadStatus({
                inProgress: false,
                message: "Album downloaded!",
                id: null,
                type: null,
            });
            return true;
        } else if (message.type === "DOWNLOAD_CHAT") {
            const { nomiId } = message.data;

            if (downloadStatus.inProgress) {
                Log("Already downloading");
                return;
            }

            updateDownloadStatus({
                inProgress: true,
                message: "Starting download...",
                id: nomiId,
                type: "nomi",
            });

            await nomi.downloadChat({
                nomiId,
                includeSelfies: true,
                onProgress: (status) => {
                    updateDownloadStatus({
                        inProgress: true,
                        message: status,
                        id: nomiId,
                        type: "nomi",
                    });
                },
            });

            updateDownloadStatus({
                inProgress: false,
                message: "Chat downloaded!",
                id: null,
                type: null,
            });
            return true;
        } else if (message.type === "DOWNLOAD_MIND") {
            const { nomiId } = message.data;

            if (downloadStatus.inProgress) {
                Log("Already downloading");
                return;
            }

            updateDownloadStatus({
                inProgress: true,
                message: "Starting mind download...",
                id: nomiId,
                type: "nomi",
            });

            try {
                const data = await nomi.getMindInfo({ nomiId });

                if (!data) return;

                // Generate HTML from mind data
                const htmlContent = generateMindMapHtml(data);

                // Convert HTML to data URL for download
                const encodedHtml = encodeURIComponent(htmlContent);
                const dataUrl = `data:text/html;charset=utf-8,${encodedHtml}`;

                // Use Chrome download API
                chrome.downloads.download({
                    url: dataUrl,
                    filename: `mind-map-${nomiId}-${new Date().getTime()}.html`,
                    saveAs: true,
                });

                updateDownloadStatus({
                    inProgress: false,
                    message: "Mind downloaded!",
                    id: null,
                    type: null,
                });
            } catch (error) {
                Log("Error downloading mind:", error);
                updateDownloadStatus({
                    inProgress: false,
                    message: "Error downloading mind",
                    id: null,
                    type: null,
                });
            }
            return true;
        } else if (message.type === "DOWNLOAD_BACKSTORY") {
            const { nomiId } = message.data;

            if (downloadStatus.inProgress) {
                Log("Already downloading");
                return;
            }

            updateDownloadStatus({
                inProgress: true,
                message: "Starting backstory download...",
                id: nomiId,
                type: "nomi",
            });

            try {
                // TODO: Implement backstory download logic
                await nomi.get({ nomiId });
                updateDownloadStatus({
                    inProgress: false,
                    message: "Backstory downloaded!",
                    id: null,
                    type: null,
                });
            } catch (error) {
                Log("Error downloading backstory:", error);
                updateDownloadStatus({
                    inProgress: false,
                    message: "Error downloading backstory",
                    id: null,
                    type: null,
                });
            }
            return true;
        } else if (message.type === "DOWNLOAD_JSON") {
            const { nomiId } = message.data;

            if (downloadStatus.inProgress) {
                Log("Already downloading");
                return;
            }

            updateDownloadStatus({
                inProgress: true,
                message: "Starting JSON download...",
                id: nomiId,
                type: "nomi",
            });

            try {
                // TODO: Implement JSON download logic
                await nomi.get({ nomiId });
                updateDownloadStatus({
                    inProgress: false,
                    message: "JSON downloaded!",
                    id: null,
                    type: null,
                });
            } catch (error) {
                Log("Error downloading JSON:", error);
                updateDownloadStatus({
                    inProgress: false,
                    message: "Error downloading JSON",
                    id: null,
                    type: null,
                });
            }
            return true;
        }
    });
}
main();
