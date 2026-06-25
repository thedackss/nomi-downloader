import { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { Tooltip } from "../Tooltip";
import { RiInformation2Line } from "./RiInformation2Line";
import { RiSettingsLine } from "./RiSettingsLine";
import styles from "./styles.module.scss";

export const Settings = () => {
    const { Settings, updateSettings } = useSettings();

    const [isOpen, setIsOpen] = useState(false);
    const toggleSettings = () => setIsOpen(!isOpen);

    return (
        <div className={styles.settings}>
            <button
                type="button"
                aria-label="Toggle settings"
                className={isOpen ? styles.active : undefined}
                onClick={toggleSettings}>
                <RiSettingsLine />
                <RiSettingsLine />
            </button>

            <div
                className={`${styles.menu}${isOpen ? ` ${styles.visible}` : ""}`}>
                <h2>Settings</h2>
                <p>Here you can configure your settings.</p>

                <ul>
                    <li>
                        <h3>Interface</h3>
                    </li>
                    <li>
                        <label htmlFor="set-layout">Layout</label>
                        <select
                            id="set-layout"
                            value={Settings.layout}
                            onChange={(e) =>
                                updateSettings({
                                    layout: e.target.value as
                                        | "auto"
                                        | "mobile"
                                        | "desktop",
                                })
                            }>
                            <option value="auto">Auto (detect)</option>
                            <option value="mobile">Mobile</option>
                            <option value="desktop">Desktop</option>
                        </select>
                    </li>
                    <li>
                        <label htmlFor="set-icon-shape">Icon Shape</label>
                        <select
                            id="set-icon-shape"
                            value={Settings.list.iconShape}
                            onChange={(e) =>
                                updateSettings({
                                    list: {
                                        ...Settings.list,
                                        iconShape: e.target.value as
                                            | "square"
                                            | "circle"
                                            | "sharp",
                                    },
                                })
                            }>
                            <option value="square">Square</option>
                            <option value="circle">Circle</option>
                            <option value="sharp">Sharp</option>
                        </select>
                    </li>
                    <li>
                        <label htmlFor="set-icon-size">Icon Size</label>
                        <select
                            id="set-icon-size"
                            value={Settings.list.iconSize}
                            onChange={(e) =>
                                updateSettings({
                                    list: {
                                        ...Settings.list,
                                        iconSize: e.target.value as
                                            | "small"
                                            | "medium"
                                            | "large"
                                            | "xlarge",
                                    },
                                })
                            }>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="xlarge">X-Large</option>
                        </select>
                    </li>
                    <li>
                        <label htmlFor="set-show-stats">Show stats</label>
                        <div className={styles.row}>
                            <label className={styles.switch}>
                                <input
                                    id="set-show-stats"
                                    type="checkbox"
                                    checked={Settings.showStats}
                                    onChange={(e) =>
                                        updateSettings({
                                            showStats: e.target.checked,
                                        })
                                    }
                                />
                                <span className={styles.slider}></span>
                            </label>
                            <p
                                style={{
                                    margin: 0,
                                    opacity: 0.7,
                                    fontSize: "0.8rem",
                                }}>
                                {Settings.showStats
                                    ? "Daily usage shown"
                                    : "Hidden"}
                            </p>
                        </div>
                    </li>
                    <li>
                        <h3>Album</h3>
                    </li>
                    <li>
                        <label htmlFor="set-quantity">
                            <span>Concurrent Downloads</span>
                            <Tooltip
                                className={styles.warning}
                                text="High values may cause performance issues">
                                <span className={styles.icon}>
                                    <RiInformation2Line />
                                </span>
                            </Tooltip>
                        </label>
                        <div className={styles.row}>
                            <input
                                id="set-quantity"
                                type="range"
                                min={1}
                                max={10}
                                value={Settings.albumDownload.downloadQuantity}
                                onChange={(e) =>
                                    updateSettings({
                                        albumDownload: {
                                            ...Settings.albumDownload,
                                            downloadQuantity: parseInt(
                                                e.target.value,
                                                10,
                                            ),
                                        },
                                    })
                                }
                            />
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={Settings.albumDownload.downloadQuantity}
                                onChange={(e) =>
                                    updateSettings({
                                        albumDownload: {
                                            ...Settings.albumDownload,
                                            downloadQuantity: parseInt(
                                                e.target.value,
                                                10,
                                            ),
                                        },
                                    })
                                }
                            />
                        </div>
                    </li>
                    <li>
                        <label htmlFor="set-quality">
                            Image Quality
                            {Settings.albumDownload.quality === "HD" ? (
                                <Tooltip
                                    className={styles.warning}
                                    text="HD quality may result in larger file sizes and longer download times">
                                    <span className={styles.icon}>
                                        <RiInformation2Line />
                                    </span>
                                </Tooltip>
                            ) : (
                                ""
                            )}
                        </label>
                        <select
                            id="set-quality"
                            value={Settings.albumDownload.quality}
                            onChange={(e) =>
                                updateSettings({
                                    albumDownload: {
                                        ...Settings.albumDownload,
                                        quality: e.target.value as "HD" | "SD",
                                    },
                                })
                            }>
                            <option value="HD">HD</option>
                            <option value="SD">SD</option>
                        </select>
                    </li>
                    <li>
                        <label htmlFor="set-images-per-zip">
                            Images per zip
                            <Tooltip
                                className={styles.warning}
                                text="0 = auto (split only when a zip gets too large). Set a number to cap how many images each zip holds.">
                                <span className={styles.icon}>
                                    <RiInformation2Line />
                                </span>
                            </Tooltip>
                        </label>
                        <div className={styles.row}>
                            <input
                                id="set-images-per-zip"
                                type="number"
                                min={0}
                                step={100}
                                value={Settings.albumDownload.imagesPerZip}
                                onChange={(e) =>
                                    updateSettings({
                                        albumDownload: {
                                            ...Settings.albumDownload,
                                            imagesPerZip: Math.max(
                                                0,
                                                parseInt(e.target.value, 10) ||
                                                    0,
                                            ),
                                        },
                                    })
                                }
                            />
                            <p
                                style={{
                                    margin: 0,
                                    opacity: 0.7,
                                    fontSize: "0.8rem",
                                }}>
                                {Settings.albumDownload.imagesPerZip > 0
                                    ? `${Settings.albumDownload.imagesPerZip} per zip`
                                    : "Auto (split by size)"}
                            </p>
                        </div>
                    </li>
                    <li>
                        <label htmlFor="set-folders">
                            Organize into folders
                        </label>
                        <div className={styles.row}>
                            <label className={styles.switch}>
                                <input
                                    id="set-folders"
                                    type="checkbox"
                                    checked={
                                        Settings.albumDownload.folderization
                                    }
                                    onChange={(e) =>
                                        updateSettings({
                                            albumDownload: {
                                                ...Settings.albumDownload,
                                                folderization: e.target.checked,
                                            },
                                        })
                                    }
                                />
                                <span className={styles.slider}></span>
                            </label>
                            <p
                                style={{
                                    margin: 0,
                                    opacity: 0.7,
                                    fontSize: "0.8rem",
                                }}>
                                {Settings.albumDownload.folderization
                                    ? "Enabled"
                                    : "Disabled"}
                            </p>
                        </div>
                    </li>
                    <li>
                        <h3>Chat</h3>
                    </li>
                    <li>
                        <label htmlFor="set-max-messages">
                            Max messages
                            <Tooltip
                                className={styles.warning}
                                text="0 = unlimited. Set a number to export only the most recent N. Counts timeline items, so a few selfie blocks may be included.">
                                <span className={styles.icon}>
                                    <RiInformation2Line />
                                </span>
                            </Tooltip>
                        </label>
                        <div className={styles.row}>
                            <input
                                id="set-max-messages"
                                type="number"
                                min={0}
                                step={50}
                                value={Settings.chatDownload.maxMessages}
                                onChange={(e) =>
                                    updateSettings({
                                        chatDownload: {
                                            ...Settings.chatDownload,
                                            maxMessages: Math.max(
                                                0,
                                                parseInt(e.target.value, 10) ||
                                                    0,
                                            ),
                                        },
                                    })
                                }
                            />
                            <p
                                style={{
                                    margin: 0,
                                    opacity: 0.7,
                                    fontSize: "0.8rem",
                                }}>
                                {Settings.chatDownload.maxMessages > 0
                                    ? `Last ${Settings.chatDownload.maxMessages} messages`
                                    : "All messages"}
                            </p>
                        </div>
                    </li>
                    <li>
                        <label htmlFor="set-include-selfies">
                            Include selfies
                        </label>
                        <div className={styles.row}>
                            <label className={styles.switch}>
                                <input
                                    id="set-include-selfies"
                                    type="checkbox"
                                    checked={
                                        Settings.chatDownload.includeSelfies
                                    }
                                    onChange={(e) =>
                                        updateSettings({
                                            chatDownload: {
                                                ...Settings.chatDownload,
                                                includeSelfies:
                                                    e.target.checked,
                                            },
                                        })
                                    }
                                />
                                <span className={styles.slider}></span>
                            </label>
                            <p
                                style={{
                                    margin: 0,
                                    opacity: 0.7,
                                    fontSize: "0.8rem",
                                }}>
                                {Settings.chatDownload.includeSelfies
                                    ? "Embedded in chat"
                                    : "Text only"}
                            </p>
                        </div>
                    </li>
                    <li>
                        <h3>Advanced</h3>
                    </li>
                    <li>
                        <label htmlFor="set-debug">
                            Debug mode
                            <Tooltip
                                className={styles.warning}
                                text="Log verbose details to the console. Useful when reporting an issue.">
                                <span className={styles.icon}>
                                    <RiInformation2Line />
                                </span>
                            </Tooltip>
                        </label>
                        <div className={styles.row}>
                            <label className={styles.switch}>
                                <input
                                    id="set-debug"
                                    type="checkbox"
                                    checked={Settings.debug}
                                    onChange={(e) =>
                                        updateSettings({
                                            debug: e.target.checked,
                                        })
                                    }
                                />
                                <span className={styles.slider}></span>
                            </label>
                            <p
                                style={{
                                    margin: 0,
                                    opacity: 0.7,
                                    fontSize: "0.8rem",
                                }}>
                                {Settings.debug ? "Enabled" : "Disabled"}
                            </p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};
