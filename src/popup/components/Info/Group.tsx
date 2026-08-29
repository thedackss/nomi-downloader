import { useEffect, useRef, useState } from "react";
import type { GroupChat } from "../../../nomi/types/api.groupChats";
import { useBackground } from "../../hooks/useBackground";
import { useSettings } from "../../hooks/useSettings";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";

interface GroupInfoProps {
    group: GroupChat;
}

export const GroupInfo = ({ group }: GroupInfoProps) => {
    const {
        downloadStatus,
        downloadGroupChat,
        downloadGroupJson,
        downloadGroupMarkdown,
    } = useBackground();
    const { Settings, updateSettings } = useSettings();
    const dl = Settings.download;

    // In advanced mode the select offers only the enabled group types.
    const allOptions: Array<{
        name: string;
        key: "chat" | "json" | "markdown";
        fn: () => void;
    }> = [
        { name: "Chat", key: "chat", fn: downloadGroupChat },
        { name: "JSON", key: "json", fn: downloadGroupJson },
        { name: "Markdown", key: "markdown", fn: downloadGroupMarkdown },
    ];
    const downloadOptions = allOptions.filter((o) => dl[o.key]);

    // The selection is remembered in settings (as the type key) and the option
    // resolved fresh each render so the click always uses the latest settings
    // (avoids a stale closure).
    const selected =
        downloadOptions.find((o) => o.key === dl.lastGroupType) ??
        downloadOptions[0];
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const splitRef = useRef<HTMLDivElement>(null);

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

    const isCurrentGroup =
        downloadStatus.type === "group" && downloadStatus.id === group.id;
    const message = isCurrentGroup
        ? downloadStatus.message
        : "Another download is in progress";

    return (
        <>
            <h2>{group.name}</h2>

            <ul>
                <li>
                    <span className={styles.bold}>Type: </span>
                    <span>{group.type}</span>
                </li>
                <li>
                    <span className={styles.bold}>Created: </span>
                    <span>{new Date(group.created).toLocaleDateString()}</span>
                </li>
                <li>
                    <span className={styles.bold}>Image style: </span>
                    <span>{group.artSettings.imageStyle}</span>
                </li>
                {group.nomis.length > 0 && (
                    <li>
                        <span className={styles.bold}>Members: </span>
                        <span>{group.nomis.map((n) => n.name).join(", ")}</span>
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
                            onClick={downloadGroupChat}
                            disabled={downloadStatus.inProgress}>
                            Download Chat
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
                ) : downloadOptions.length === 1 ? (
                    <div className={styles.splitButton}>
                        <button
                            type="button"
                            className={`${styles.splitMain} ${styles.solo}`}
                            onClick={selected?.fn}
                            disabled={downloadStatus.inProgress}>
                            Download {selected?.name}
                        </button>
                    </div>
                ) : (
                    <div className={styles.splitButton} ref={splitRef}>
                        <button
                            type="button"
                            className={styles.splitMain}
                            onClick={selected?.fn}
                            disabled={downloadStatus.inProgress}>
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
                                {downloadOptions.map((option) => (
                                    <button
                                        type="button"
                                        key={option.name}
                                        className={
                                            selected?.key === option.key
                                                ? styles.active
                                                : undefined
                                        }
                                        onClick={() => {
                                            updateSettings({
                                                download: {
                                                    ...dl,
                                                    lastGroupType: option.key,
                                                },
                                            });
                                            setDropdownOpen(false);
                                        }}
                                        disabled={downloadStatus.inProgress}>
                                        {option.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
