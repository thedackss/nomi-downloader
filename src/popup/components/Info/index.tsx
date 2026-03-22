import { useEffect, useState } from "react";
import type React from "react";
import { useNomi } from "../../hooks/useNomi";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";
import type { DownloadStatus } from "./interfaces";
import { useSettings } from "../../hooks/useSettings";
import { NomiInfo } from "./Nomi";
import { GroupInfo } from "./Group";

const API = "https://beta.nomi.ai/api";

function getNomiImageUrl(nomi: {
    id: number;
    pictureImageId: string;
    pictureSelfieImageId?: string | null;
}) {
    const base = `${API}/nomis/${nomi.id}`;
    return nomi.pictureSelfieImageId
        ? `${base}/selfies/${nomi.pictureSelfieImageId}.webp`
        : `${base}/images/${nomi.pictureImageId}.webp`;
}

export const Info = () => {
    const { Nomis } = useNomi();
    const { Settings, isMobile } = useSettings();

    const [loading, setLoading] = useState(true);
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({
        inProgress: false,
        message: "You shouldn't be able to see this message",
        id: null,
        type: null,
    });

    const Nomi = Nomis.selected.nomi;
    const Group = Nomis.selected.group;

    const bgImages: string[] = [];

    if (isMobile) {
        if (Nomi) {
            bgImages.push(getNomiImageUrl(Nomi));
        } else if (Group) {
            bgImages.push(...Group.nomis.slice(0, 4).map(getNomiImageUrl));
        }
    }

    let bgStyle: React.CSSProperties | undefined;
    if (bgImages.length > 0) {
        bgStyle = {
            "--bg-image-1": `url(${bgImages[0]})`,
            ...(bgImages[1] && { "--bg-image-2": `url(${bgImages[1]})` }),
            ...(bgImages[2] && { "--bg-image-3": `url(${bgImages[2]})` }),
            ...(bgImages[3] && { "--bg-image-4": `url(${bgImages[3]})` }),
        } as React.CSSProperties;
    }

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

    async function handleDownloadMind() {
        if (!Nomi) return;
        chrome.runtime.sendMessage({
            type: "DOWNLOAD_MIND",
            data: {
                nomiId: Nomi.id,
            },
        });
        setDownloadStatus({
            inProgress: true,
            message: "Starting mind download...",
            id: Nomi.id,
            type: "nomi",
        });
    }

    async function handleDownloadBackstory() {
        if (!Nomi) return;
        chrome.runtime.sendMessage({
            type: "DOWNLOAD_BACKSTORY",
            data: {
                nomiId: Nomi.id,
            },
        });
        setDownloadStatus({
            inProgress: true,
            message: "Starting backstory download...",
            id: Nomi.id,
            type: "nomi",
        });
    }

    async function handleDownloadJSON() {
        if (!Nomi) return;
        chrome.runtime.sendMessage({
            type: "DOWNLOAD_JSON",
            data: {
                nomiId: Nomi.id,
            },
        });
        setDownloadStatus({
            inProgress: true,
            message: "Starting JSON download...",
            id: Nomi.id,
            type: "nomi",
        });
    }

    return (
        <div
            className={styles.nomiInfo}
            style={bgStyle}
            data-bg={bgImages.length > 0 ? "" : undefined}
        >
            {(() => {
                if (Nomi) {
                    return (
                        <NomiInfo
                            nomi={Nomi}
                            downloadStatus={downloadStatus}
                            onDownloadAlbum={handleDownloadAlbum}
                            onDownloadChat={handleDownloadChat}
                            onDownloadMind={handleDownloadMind}
                            onDownloadBackstory={handleDownloadBackstory}
                            onDownloadJSON={handleDownloadJSON}
                        />
                    );
                } else if (Group) {
                    return (
                        <GroupInfo
                            group={Group}
                            downloadStatus={downloadStatus}
                            onDownloadChat={() => {}}
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
