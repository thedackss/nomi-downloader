import { useEffect, useRef, useState } from "react";
import { NomiApiClient } from "../../../nomi/api";
import type { Nomi } from "../../../nomi/types/api.nomis";
import type { DownloadTypeKey } from "../../context/settings/interfaces";
import { useBackground } from "../../hooks/useBackground";
import { useSettings } from "../../hooks/useSettings";
import { LoadingSpin } from "../LoadingSpin";
import { Tooltip } from "../Tooltip";
import styles from "./styles.module.scss";

interface NomiInfoProps {
    nomi: Nomi;
}

export const NomiInfo = ({ nomi }: NomiInfoProps) => {
    const {
        downloadStatus,
        downloadSimple,
        downloadAlbum,
        downloadChat,
        downloadMind,
        downloadBackstory,
        downloadJSON,
        downloadMarkdown,
    } = useBackground();
    const { Settings, updateSettings } = useSettings();
    const dl = Settings.download;

    // In advanced mode the select offers only the enabled types.
    const allOptions: Array<{
        name: string;
        key: DownloadTypeKey;
        fn: () => void;
    }> = [
        { name: "Album", key: "album", fn: downloadAlbum },
        { name: "Chat", key: "chat", fn: downloadChat },
        { name: "Mind Map", key: "mindMap", fn: downloadMind },
        { name: "Shared Notes", key: "sharedNotes", fn: downloadBackstory },
        { name: "JSON", key: "json", fn: downloadJSON },
        { name: "Markdown", key: "markdown", fn: downloadMarkdown },
    ];
    const downloadOptions = allOptions.filter((o) => dl[o.key]);

    const [mindMapActive, setMindMapActive] = useState(false);
    // The selection is remembered in settings (as the type key) and the option
    // resolved fresh each render — storing the option object would capture a
    // stale download closure (and thus stale settings) until the popup is
    // reopened.
    const selected =
        downloadOptions.find((o) => o.key === dl.lastType) ??
        downloadOptions[0];
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

            <div
                className={
                    styles.downloadSection +
                    `${
                        downloadStatus.inProgress ? ` ${styles.inProgress}` : ""
                    }`
                }>
                <LoadingSpin
                    className={styles.loadingSpin}
                    visible={downloadStatus.inProgress}>
                    <h3>
                        Downloading
                        <p>{message}</p>
                    </h3>
                </LoadingSpin>
                {!dl.advanced ? (
                    <div className={styles.splitButton}>
                        <button
                            type="button"
                            className={`${styles.splitMain} ${styles.solo}`}
                            onClick={downloadSimple}
                            disabled={downloadStatus.inProgress}>
                            Download
                        </button>
                    </div>
                ) : downloadOptions.length === 0 ? (
                    <div className={styles.splitButton}>
                        <button
                            type="button"
                            className={`${styles.splitMain} ${styles.solo}`}
                            disabled>
                            No downloads enabled
                        </button>
                    </div>
                ) : (
                    <div className={styles.splitButton} ref={splitRef}>
                        <button
                            type="button"
                            className={styles.splitMain}
                            onClick={selected?.fn}
                            title={
                                mindMapActive === false &&
                                selected?.name === "Mind Map"
                                    ? "This Nomi has no mind map"
                                    : undefined
                            }
                            disabled={
                                downloadStatus.inProgress ||
                                (mindMapActive === false &&
                                    selected?.name === "Mind Map")
                            }>
                            Download {selected?.name}
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
                                {downloadOptions.map((option) => {
                                    const noMindMap =
                                        mindMapActive === false &&
                                        option.name === "Mind Map";
                                    return (
                                        <Tooltip
                                            key={option.name}
                                            block
                                            position="left"
                                            text={
                                                noMindMap
                                                    ? "This Nomi has no mind map"
                                                    : undefined
                                            }
                                            className={
                                                noMindMap
                                                    ? styles.optionDisabled
                                                    : undefined
                                            }>
                                            <button
                                                type="button"
                                                className={
                                                    selected?.key === option.key
                                                        ? styles.active
                                                        : undefined
                                                }
                                                onClick={() => {
                                                    updateSettings({
                                                        download: {
                                                            ...dl,
                                                            lastType:
                                                                option.key,
                                                        },
                                                    });
                                                    setDropdownOpen(false);
                                                }}
                                                disabled={
                                                    downloadStatus.inProgress ||
                                                    noMindMap
                                                }>
                                                {option.name}
                                            </button>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
