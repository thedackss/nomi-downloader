import { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { Tooltip } from "../Tooltip";
import { RiInformation2Line } from "./RiInformation2Line";
import { RiSettingsLine } from "./RiSettingsLine";
import styles from "./styles.module.scss";

export const Settings = () => {
    const { Settings, updateSettings, menuOpen, setMenuOpen } = useSettings();
    const dl = Settings.download;

    const toggleSettings = () => setMenuOpen(!menuOpen);

    type Tab = "interface" | "downloads" | "advanced";
    const [tab, setTab] = useState<Tab>("interface");
    const tabs: Array<{ id: Tab; label: string }> = [
        { id: "interface", label: "Interface" },
        { id: "downloads", label: "Downloads" },
        { id: "advanced", label: "Advanced" },
    ];

    // A per-type "Enable X download" toggle, grayed while advanced mode is off
    // (the simple button ignores per-type choices). Lives in the Advanced tab.
    type DownloadType =
        | "album"
        | "chat"
        | "mindMap"
        | "sharedNotes"
        | "json"
        | "markdown";
    const enableToggle = (key: DownloadType, label: string) => (
        <li style={{ opacity: dl.advanced ? 1 : 0.4 }}>
            <label htmlFor={`set-dl-${key}`}>{label}</label>
            <div className={styles.row}>
                <label className={styles.switch}>
                    <input
                        id={`set-dl-${key}`}
                        type="checkbox"
                        disabled={!dl.advanced}
                        checked={dl[key]}
                        onChange={(e) =>
                            updateSettings({
                                download: { ...dl, [key]: e.target.checked },
                            })
                        }
                    />
                    <span className={styles.slider}></span>
                </label>
            </div>
        </li>
    );

    return (
        <div className={styles.settings}>
            <button
                type="button"
                aria-label="Toggle settings"
                className={menuOpen ? styles.active : undefined}
                onClick={toggleSettings}>
                <RiSettingsLine />
                <RiSettingsLine />
            </button>

            <div
                className={`${styles.menu}${menuOpen ? ` ${styles.visible}` : ""}`}>
                <h2>Settings</h2>
                <p>Here you can configure your settings.</p>

                <div className={styles.tabs}>
                    {tabs.map((t) => (
                        <button
                            type="button"
                            key={t.id}
                            className={
                                tab === t.id ? styles.activeTab : undefined
                            }
                            onClick={() => setTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                <ul>
                    {tab === "interface" && (
                        <>
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
                                <label htmlFor="set-icon-shape">
                                    Icon Shape
                                </label>
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
                                <label htmlFor="set-show-stats">
                                    Show stats
                                </label>
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
                        </>
                    )}
                    {tab === "downloads" && (
                        <>
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
                                        value={
                                            Settings.albumDownload
                                                .downloadQuantity
                                        }
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
                                        value={
                                            Settings.albumDownload
                                                .downloadQuantity
                                        }
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
                                                quality: e.target.value as
                                                    | "HD"
                                                    | "SD",
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
                                        value={
                                            Settings.albumDownload.imagesPerZip
                                        }
                                        onChange={(e) =>
                                            updateSettings({
                                                albumDownload: {
                                                    ...Settings.albumDownload,
                                                    imagesPerZip: Math.max(
                                                        0,
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 0,
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
                                <label htmlFor="set-max-zip-size">
                                    Max zip size (MB)
                                    <Tooltip
                                        className={styles.warning}
                                        text="Albums also split when a zip's estimated size passes this, regardless of the image count. The zip is built in memory, so very large values may fail. Default 750.">
                                        <span className={styles.icon}>
                                            <RiInformation2Line />
                                        </span>
                                    </Tooltip>
                                </label>
                                <div className={styles.row}>
                                    <input
                                        id="set-max-zip-size"
                                        type="number"
                                        min={100}
                                        step={250}
                                        value={
                                            Settings.albumDownload.maxZipSizeMB
                                        }
                                        onChange={(e) =>
                                            updateSettings({
                                                albumDownload: {
                                                    ...Settings.albumDownload,
                                                    maxZipSizeMB: Math.max(
                                                        100,
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 750,
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
                                        {`~${Settings.albumDownload.maxZipSizeMB} MB per zip`}
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
                                                Settings.albumDownload
                                                    .folderization
                                            }
                                            onChange={(e) =>
                                                updateSettings({
                                                    albumDownload: {
                                                        ...Settings.albumDownload,
                                                        folderization:
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
                                        {Settings.albumDownload.folderization
                                            ? "Enabled"
                                            : "Disabled"}
                                    </p>
                                </div>
                            </li>
                            <li>
                                <label htmlFor="set-prompts">
                                    Prompt files
                                    <Tooltip
                                        className={styles.warning}
                                        text="Save the generation prompt for Art and edited photos. Embedding writes into the image metadata (PNG/HD only); WebP and videos always use a sidecar .txt.">
                                        <span className={styles.icon}>
                                            <RiInformation2Line />
                                        </span>
                                    </Tooltip>
                                </label>
                                <select
                                    id="set-prompts"
                                    value={Settings.albumDownload.prompts}
                                    onChange={(e) =>
                                        updateSettings({
                                            albumDownload: {
                                                ...Settings.albumDownload,
                                                prompts: e.target.value as
                                                    | "off"
                                                    | "sidecar"
                                                    | "embed"
                                                    | "both",
                                            },
                                        })
                                    }>
                                    <option value="off">Off</option>
                                    <option value="sidecar">
                                        Sidecar .txt
                                    </option>
                                    <option value="embed">
                                        Image metadata
                                    </option>
                                    <option value="both">Both</option>
                                </select>
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
                                        value={
                                            Settings.chatDownload.maxMessages
                                        }
                                        onChange={(e) =>
                                            updateSettings({
                                                chatDownload: {
                                                    ...Settings.chatDownload,
                                                    maxMessages: Math.max(
                                                        0,
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 0,
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
                                <label htmlFor="set-messages-per-file">
                                    Messages per file
                                    <Tooltip
                                        className={styles.warning}
                                        text="0 = no limit. Split the export into HTML files of at most this many messages each (the size cap below still applies).">
                                        <span className={styles.icon}>
                                            <RiInformation2Line />
                                        </span>
                                    </Tooltip>
                                </label>
                                <div className={styles.row}>
                                    <input
                                        id="set-messages-per-file"
                                        type="number"
                                        min={0}
                                        step={500}
                                        value={
                                            Settings.chatDownload
                                                .messagesPerFile
                                        }
                                        onChange={(e) =>
                                            updateSettings({
                                                chatDownload: {
                                                    ...Settings.chatDownload,
                                                    messagesPerFile: Math.max(
                                                        0,
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 0,
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
                                        {Settings.chatDownload.messagesPerFile >
                                        0
                                            ? `${Settings.chatDownload.messagesPerFile} per file`
                                            : "No limit (size only)"}
                                    </p>
                                </div>
                            </li>
                            <li>
                                <label htmlFor="set-chat-max-size">
                                    Max file size (MB)
                                    <Tooltip
                                        className={styles.warning}
                                        text="0 = built-in safe cap (10 MB text / 75 MB with selfies). The file is built in memory, so very large values may fail. Raise it to split less often.">
                                        <span className={styles.icon}>
                                            <RiInformation2Line />
                                        </span>
                                    </Tooltip>
                                </label>
                                <div className={styles.row}>
                                    <input
                                        id="set-chat-max-size"
                                        type="number"
                                        min={0}
                                        step={10}
                                        value={
                                            Settings.chatDownload.maxFileSizeMB
                                        }
                                        onChange={(e) =>
                                            updateSettings({
                                                chatDownload: {
                                                    ...Settings.chatDownload,
                                                    maxFileSizeMB: Math.max(
                                                        0,
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 0,
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
                                        {Settings.chatDownload.maxFileSizeMB > 0
                                            ? `~${Settings.chatDownload.maxFileSizeMB} MB per file`
                                            : "Auto (safe default)"}
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
                                                Settings.chatDownload
                                                    .includeSelfies
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
                                <h3>Export headers</h3>
                            </li>
                            <li>
                                <label htmlFor="set-header-video">
                                    Animate header
                                    <Tooltip
                                        className={styles.warning}
                                        text="When a Nomi's profile is a video, embed that video in the chat / mind map / shared notes HTML headers instead of a still frame. Increases file size.">
                                        <span className={styles.icon}>
                                            <RiInformation2Line />
                                        </span>
                                    </Tooltip>
                                </label>
                                <div className={styles.row}>
                                    <label className={styles.switch}>
                                        <input
                                            id="set-header-video"
                                            type="checkbox"
                                            checked={dl.embedHeaderVideo}
                                            onChange={(e) =>
                                                updateSettings({
                                                    download: {
                                                        ...dl,
                                                        embedHeaderVideo:
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
                                        {dl.embedHeaderVideo
                                            ? "Embed video (larger files)"
                                            : "Still image"}
                                    </p>
                                </div>
                            </li>
                            <li>
                                <h3>JSON</h3>
                            </li>
                            <li>
                                <label htmlFor="set-raw-data">
                                    Enable raw data
                                    <Tooltip
                                        className={styles.warning}
                                        text="Include every field the Nomi API returns, not just the cleaned export.">
                                        <span className={styles.icon}>
                                            <RiInformation2Line />
                                        </span>
                                    </Tooltip>
                                </label>
                                <div className={styles.row}>
                                    <label className={styles.switch}>
                                        <input
                                            id="set-raw-data"
                                            type="checkbox"
                                            checked={
                                                Settings.jsonDownload.rawData
                                            }
                                            onChange={(e) =>
                                                updateSettings({
                                                    jsonDownload: {
                                                        ...Settings.jsonDownload,
                                                        rawData:
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
                                        {Settings.jsonDownload.rawData
                                            ? "Full API data"
                                            : "Cleaned export"}
                                    </p>
                                </div>
                            </li>
                        </>
                    )}
                    {tab === "advanced" && (
                        <>
                            <li>
                                <h3>Downloads</h3>
                            </li>
                            <li>
                                <label htmlFor="set-advanced-download">
                                    Advanced Download
                                </label>
                                <div className={styles.row}>
                                    <label className={styles.switch}>
                                        <input
                                            id="set-advanced-download"
                                            type="checkbox"
                                            checked={dl.advanced}
                                            onChange={(e) =>
                                                updateSettings({
                                                    download: {
                                                        ...dl,
                                                        advanced:
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
                                        {dl.advanced
                                            ? "Pick which types appear on the button"
                                            : "One button: album + chat + shared notes"}
                                    </p>
                                </div>
                            </li>
                            {enableToggle("album", "Album")}
                            {enableToggle("chat", "Chat")}
                            {enableToggle("mindMap", "Mind Map")}
                            {enableToggle("sharedNotes", "Shared Notes")}
                            {enableToggle("json", "JSON")}
                            {enableToggle("markdown", "Markdown")}
                            <li>
                                <h3>Other</h3>
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
                                        {Settings.debug
                                            ? "Enabled"
                                            : "Disabled"}
                                    </p>
                                </div>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};
