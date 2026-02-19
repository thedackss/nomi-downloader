import type { DownloadStatus } from "../popup/components/NomiInfo/interfaces";
import { Log } from "../utils/log";
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
        }
    });
}
main();
