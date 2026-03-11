import { useEffect, useState } from "react";
import { useNomi } from "../../hooks/useNomi";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";
import type { DownloadStatus } from "./interfaces";
import { useSettings } from "../../hooks/useSettings";
import { NomiInfo } from "./Nomi";
import { GroupInfo } from "./Group";

export const Info = () => {
    const { Nomis } = useNomi();
    const { Settings } = useSettings();

    const [loading, setLoading] = useState(true);
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({
        inProgress: false,
        message: "You shouldn't be able to see this message",
        id: null,
        type: null,
    });

    const Nomi = Nomis.selected.nomi;
    const Group = Nomis.selected.group;

    useEffect(() => {
        async function main() {
            setLoading(false);

            // Check download status
            const status = await chrome.runtime.sendMessage({
                type: "GET_DOWNLOAD_STATUS",
            });
            if (status) setDownloadStatus(status);
        }
        main();
    }, []);

    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message && message.type === "DOWNLOAD_STATUS_UPDATE") {
                setDownloadStatus(message.status);
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    // async function handleDownloadChat() {}
    // async function handleDownloadMind() {}

    async function handleDownloadAlbum() {
        if (!Nomi) return;
        chrome.runtime.sendMessage({
            type: "DOWNLOAD_ALBUM",
            data: {
                nomiId: Nomi.id,
                downloadQuantity: Settings.albumDownload.downloadQuantity,
                folderization: Settings.albumDownload.folderization,
                quality: Settings.albumDownload.quality,
            },
        });
        // Optimistic update or wait for poll
        setDownloadStatus({
            inProgress: true,
            message: "Starting download...",
            id: Nomi.id,
            type: "nomi",
        });
    }

    async function handleDownloadChat() {
        if (!Nomi) return;
        chrome.runtime.sendMessage({
            type: "DOWNLOAD_CHAT",
            data: {
                nomiId: Nomi.id,
            },
        });
        setDownloadStatus({
            inProgress: true,
            message: "Starting chat download...",
            id: Nomi.id,
            type: "nomi",
        });
    }

    return (
        <div className={styles.nomiInfo}>
            {(() => {
                if (Nomi) {
                    return (
                        <NomiInfo
                            nomi={Nomi}
                            downloadStatus={downloadStatus}
                            onDownloadAlbum={handleDownloadAlbum}
                            onDownloadChat={handleDownloadChat}
                        />
                    );
                } else if (Group) {
                    return (
                        <GroupInfo
                            group={Group}
                            downloadStatus={downloadStatus}
                        />
                    );
                } else {
                    return (
                        <span className={styles.noNomiSelected}>
                            No Nomi selected
                        </span>
                    );
                }
            })()}
            <LoadingSpin visible={loading} />
        </div>
    );
};
