import { useEffect, useRef, useState } from "react";
import { NomiApiClient } from "../../../nomi/api";
import type { Nomi } from "../../../nomi/types/api.nomis";
import { LoadingSpin } from "../LoadingSpin";
import type { DownloadStatus } from "./interfaces";
import styles from "./styles.module.scss";

interface NomiInfoProps {
    nomi: Nomi;
    downloadStatus: DownloadStatus;
    onDownloadAlbum: () => void;
    onDownloadChat: () => void;
    onDownloadMind: () => void;
    onDownloadBackstory: () => void;
    onDownloadJSON: () => void;
}

export const NomiInfo = ({
    nomi,
    downloadStatus,
    onDownloadAlbum,
    onDownloadChat,
    onDownloadMind,
    onDownloadBackstory,
    onDownloadJSON,
}: NomiInfoProps) => {
    const downloadOptions = [
        { name: "Album", fn: onDownloadAlbum },
        { name: "Chat", fn: onDownloadChat },
        { name: "Mind Map", fn: onDownloadMind },
        { name: "Backstory+", fn: onDownloadBackstory },
        { name: "JSON", fn: onDownloadJSON },
    ];

    const [mindMapActive, setMindMapActive] = useState(false);
    const [selected, setSelected] = useState(downloadOptions[0]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const splitRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        async function main() {
            const api = new NomiApiClient();
            const data = await api.getMindInfo({ nomiId: nomi.id });

            if (!cancelled) setMindMapActive(!!data);
        }
        main();
        return () => {
            cancelled = true;
        };
    }, [nomi.id]);

    useEffect(() => {
        if (!dropdownOpen) return;
        const handler = (e: MouseEvent) => {
            if (!splitRef.current?.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [dropdownOpen]);

    const isCurrentNomi = downloadStatus.id === nomi.id;

    const message = isCurrentNomi
        ? downloadStatus.message
        : "Another Nomi is being downloaded";

    return (
        <>
            <h2>{nomi.name}</h2>

            <ul>
                <li>
                    <span className={styles.bold}>Gender: </span>
                    <span>{nomi.gender}</span>
                </li>
                <li>
                    <span className={styles.bold}>Created: </span>
                    <span>{new Date(nomi.created).toLocaleDateString()}</span>
                </li>
                <li>
                    <span className={styles.bold}>Relation type: </span>
                    <span>{nomi.relationshipType}</span>
                </li>
                <li>
                    <span className={styles.bold}>Image style: </span>
                    <span>{nomi.settings.imageStyle}</span>
                </li>
                {nomi.keyTraits.length > 0 && (
                    <li>
                        <span className={styles.bold}>Traits: </span>
                        <span>{nomi.keyTraits.join(", ")}</span>
                    </li>
                )}
                {nomi.customTraits.length > 0 && (
                    <li>
                        <span className={styles.bold}>Custom Traits: </span>
                        <span>
                            {nomi.customTraits
                                .map((t) =>
                                    typeof t === "string" ? t : t.name,
                                )
                                .join(", ")}
                        </span>
                    </li>
                )}
            </ul>

            <div className={styles.downloadSection}>
                <LoadingSpin
                    className={styles.loadingSpin}
                    visible={downloadStatus.inProgress}>
                    <h3>
                        Downloading
                        <p>{message}</p>
                    </h3>
                </LoadingSpin>

                <div className={styles.splitButton} ref={splitRef}>
                    <button
                        type="button"
                        className={styles.splitMain}
                        onClick={selected.fn}
                        disabled={
                            downloadStatus.inProgress ||
                            (mindMapActive === false &&
                                selected.name === "Mind Map")
                        }>
                        Download {selected.name}
                    </button>
                    <button
                        type="button"
                        className={styles.splitArrow}
                        onClick={() => setDropdownOpen((o) => !o)}
                        disabled={downloadStatus.inProgress}
                        aria-label="Choose download type">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            style={{
                                transform: dropdownOpen
                                    ? "rotate(180deg)"
                                    : undefined,
                                transition: "transform 0.2s ease",
                            }}>
                            <path fill="currentColor" d="M7 10l5 5 5-5z" />
                        </svg>
                    </button>
                    {dropdownOpen && (
                        <div className={styles.splitDropdown}>
                            {downloadOptions.map((option) => (
                                <button
                                    type="button"
                                    key={option.name}
                                    className={
                                        selected.name === option.name
                                            ? styles.active
                                            : undefined
                                    }
                                    onClick={() => {
                                        setSelected(option);
                                        setDropdownOpen(false);
                                    }}
                                    disabled={
                                        downloadStatus.inProgress ||
                                        (mindMapActive === false &&
                                            option.name === "Mind Map")
                                    }>
                                    {option.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
