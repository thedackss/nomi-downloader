import { useSettings } from "../../hooks/useSettings";
import { RiSettingsLine } from "./RiSettingsLine";
import styles from "./styles.module.scss";
import { useState } from "react";

export const Settings = () => {
    const { Settings, updateSettings } = useSettings();

    const [isOpen, setIsOpen] = useState(false);
    const toggleSettings = () => setIsOpen(!isOpen);

    return (
        <div className={styles.settings}>
            <button
                className={isOpen ? styles.active : undefined}
                onClick={toggleSettings}
            >
                <RiSettingsLine />
                <RiSettingsLine />
            </button>

            <div
                className={`${styles.menu}${isOpen ? ` ${styles.visible}` : ""}`}
            >
                <h2>Settings</h2>
                <p>Here you can configure your settings.</p>

                <ul>
                    <li>
                        <h3>Interface</h3>
                    </li>
                    <li>
                        <label>Layout</label>
                        <select
                            value={Settings.layout}
                            onChange={(e) =>
                                updateSettings({
                                    layout: e.target.value as
                                        | "auto"
                                        | "mobile"
                                        | "desktop",
                                })
                            }
                        >
                            <option value="auto">Auto (detect)</option>
                            <option value="mobile">Mobile</option>
                            <option value="desktop">Desktop</option>
                        </select>
                    </li>
                    <li>
                        <label>Icon Shape</label>
                        <select
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
                            }
                        >
                            <option value="square">Square</option>
                            <option value="circle">Circle</option>
                            <option value="sharp">Sharp</option>
                        </select>
                    </li>
                    <li>
                        <label>Icon Size</label>
                        <select
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
                            }
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                            <option value="xlarge">X-Large</option>
                        </select>
                    </li>
                    <li>
                        <h3>Album</h3>
                    </li>
                    <li>
                        <label>
                            <span>Concurrent Downloads</span>
                            {Settings.albumDownload.downloadQuantity > 5 ? (
                                <span className={styles.warning}>
                                    ⚠️
                                    <span className={styles.tooltip}>
                                        High values may cause performance issues
                                    </span>
                                </span>
                            ) : (
                                ""
                            )}
                        </label>
                        <div className={styles.row}>
                            <input
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
                                            ),
                                        },
                                    })
                                }
                            />
                        </div>
                    </li>
                    <li>
                        <label>
                            Image Quality
                            {Settings.albumDownload.quality === "HD" ? (
                                <span className={styles.warning}>
                                    ℹ️
                                    <span className={styles.tooltip}>
                                        HD quality may result in larger file
                                        sizes and longer download times
                                    </span>
                                </span>
                            ) : (
                                ""
                            )}
                        </label>
                        <select
                            value={Settings.albumDownload.quality}
                            onChange={(e) =>
                                updateSettings({
                                    albumDownload: {
                                        ...Settings.albumDownload,
                                        quality: e.target.value as "HD" | "SD",
                                    },
                                })
                            }
                        >
                            <option value="HD">HD</option>
                            <option value="SD">SD</option>
                        </select>
                    </li>
                    <li>
                        <label>Organize into folders</label>
                        <div className={styles.row}>
                            <label className={styles.switch}>
                                <input
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
                                }}
                            >
                                {Settings.albumDownload.folderization
                                    ? "Enabled"
                                    : "Disabled"}
                            </p>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
};
