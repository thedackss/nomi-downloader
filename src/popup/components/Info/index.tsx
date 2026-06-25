import type React from "react";
import { useEffect, useState } from "react";
import { getNomiImageUrl } from "../../../nomi/media";
import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { LoadingSpin } from "../LoadingSpin";
import { GroupInfo } from "./Group";
import type { DownloadStatus } from "./interfaces";
import { NomiInfo } from "./Nomi";
import styles from "./styles.module.scss";

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
        const handleMessage = (message: {
            type?: string;
            status?: DownloadStatus;
        }) => {
            if (message?.type === "DOWNLOAD_STATUS_UPDATE" && message.status) {
                setDownloadStatus(message.status);
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    function startDownload(
        type: string,
        message: string,
        extraData?: Record<string, unknown>,
    ) {
        if (!Nomi) return;
        chrome.runtime.sendMessage({
            type,
            data: { nomiId: Nomi.id, debug: Settings.debug, ...extraData },
        });
        // Optimistic update; the background broadcasts real progress
        setDownloadStatus({
            inProgress: true,
            message,
            id: Nomi.id,
            type: "nomi",
        });
    }

    const handleDownloadAlbum = () =>
        startDownload("DOWNLOAD_ALBUM", "Starting download...", {
            downloadQuantity: Settings.albumDownload.downloadQuantity,
            folderization: Settings.albumDownload.folderization,
            quality: Settings.albumDownload.quality,
            imagesPerZip: Settings.albumDownload.imagesPerZip,
        });

    const handleDownloadChat = () =>
        startDownload("DOWNLOAD_CHAT", "Starting chat download...", {
            maxMessages: Settings.chatDownload.maxMessages,
            includeSelfies: Settings.chatDownload.includeSelfies,
        });

    const handleDownloadMind = () =>
        startDownload("DOWNLOAD_MIND", "Starting mind download...");

    const handleDownloadBackstory = () =>
        startDownload("DOWNLOAD_BACKSTORY", "Starting backstory download...");

    const handleDownloadJSON = () =>
        startDownload("DOWNLOAD_JSON", "Starting JSON download...");

    return (
        <div
            className={styles.nomiInfo}
            style={bgStyle}
            data-bg={bgImages.length > 0 ? "" : undefined}>
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
