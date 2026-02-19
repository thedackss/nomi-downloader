import { useEffect, useState } from "react";
import { useNomi } from "../../hooks/useNomi";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";
import type { DownloadStatus } from "./interfaces";
import { useSettings } from "../../hooks/useSettings";

export const NomiInfo = () => {
    const { Nomis, checkSelectedNomi } = useNomi();
    const { Settings } = useSettings();

    const [loading, setLoading] = useState(true);
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({
        inProgress: false,
        message: "You shouldn't be able to see this message",
        id: null,
        type: null,
    });

    const Nomi = Nomis.selected.nomi;

    useEffect(() => {
        async function main() {
            if (Nomis.list.nomi.length < 1) return;
            await checkSelectedNomi();
            setLoading(false);

            // Check download status
            const status = await chrome.runtime.sendMessage({
                type: "GET_DOWNLOAD_STATUS",
            });
            if (status) setDownloadStatus(status);
        }
        main();
    }, [Nomis.list, checkSelectedNomi]);

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

    return (
        <div className={styles.nomiInfo}>
            {(() => {
                if (!Nomi) {
                    return (
                        <span className={styles.noNomiSelected}>
                            No Nomi selected
                        </span>
                    );
                } else {
                    const isCurrentNomi = downloadStatus.id === Nomi.id;

                    const message = isCurrentNomi
                        ? downloadStatus.message
                        : "Another Nomi is being downloaded";

                    return (
                        <>
                            <h2>{Nomi.name}</h2>

                            <ul>
                                <li>
                                    <span className={styles.bold}>
                                        Gender:{" "}
                                    </span>
                                    <span>{Nomi.gender}</span>
                                </li>
                                <li>
                                    <span className={styles.bold}>
                                        Created:{" "}
                                    </span>
                                    <span>
                                        {new Date(
                                            Nomi.created,
                                        ).toLocaleDateString()}
                                    </span>
                                </li>
                                <li>
                                    <span className={styles.bold}>
                                        Relation type:{" "}
                                    </span>
                                    <span>{Nomi.relationshipType}</span>
                                </li>
                                <li>
                                    <span className={styles.bold}>
                                        Image style:{" "}
                                    </span>
                                    <span>{Nomi.settings.imageStyle}</span>
                                </li>
                                {Nomi.keyTraits.length > 0 && (
                                    <li>
                                        <span className={styles.bold}>
                                            Traits:{" "}
                                        </span>
                                        <span>{Nomi.keyTraits.join(", ")}</span>
                                    </li>
                                )}
                                {Nomi.customTraits.length > 0 && (
                                    <li>
                                        <span className={styles.bold}>
                                            Custom Traits:{" "}
                                        </span>
                                        <span>{Nomi.customTraits}</span>
                                    </li>
                                )}
                                {/* <li>
                                    <span className={styles.bold}>
                                        Messages count:{" "}
                                    </span>
                                    <span>0</span>
                                </li>
                                <li>
                                    <span className={styles.bold}>
                                        Album count:{" "}
                                    </span>
                                    <span>0</span>
                                </li> */}
                            </ul>

                            <div className={styles.downloadSection}>
                                <LoadingSpin
                                    className={styles.loadingSpin}
                                    visible={downloadStatus.inProgress}
                                >
                                    <h3>
                                        Downloading
                                        <p>{message}</p>
                                    </h3>
                                </LoadingSpin>

                                <h2>Download</h2>

                                <button>Chat</button>
                                <button>Mind Map</button>
                                <button
                                    onClick={handleDownloadAlbum}
                                    disabled={downloadStatus.inProgress}
                                >
                                    Album
                                </button>
                            </div>
                        </>
                    );
                }
            })()}
            <LoadingSpin visible={loading} />
        </div>
    );
};
