import { useState } from "react";
import { clearIncremental } from "../../../../background/nomi/incrementalStore";
import { useSettings } from "../../../hooks/useSettings";
import { Group, Row, Switch } from "../controls";

export const ExportsSection = () => {
    const { Settings, updateSettings } = useSettings();
    const dl = Settings.download;

    // Transient confirmation after clearing the incremental download history.
    const [historyCleared, setHistoryCleared] = useState(false);

    return (
        <>
            <Group title="Export headers">
                <Row
                    label="Animate header"
                    tooltip="When a Nomi's profile is a video, embed that video in the chat / mind map / shared notes HTML headers instead of a still frame. Increases file size."
                    htmlFor="set-header-video"
                    hint={
                        dl.embedHeaderVideo
                            ? "Embed video (larger files)"
                            : "Still image"
                    }>
                    <Switch
                        id="set-header-video"
                        checked={dl.embedHeaderVideo}
                        onChange={(embedHeaderVideo) =>
                            updateSettings({
                                download: { ...dl, embedHeaderVideo },
                            })
                        }
                    />
                </Row>
            </Group>
            <Group title="JSON">
                <Row
                    label="Enable raw data"
                    tooltip="Include every field the Nomi API returns, not just the cleaned export."
                    htmlFor="set-raw-data"
                    hint={
                        Settings.jsonDownload.rawData
                            ? "Full API data"
                            : "Cleaned export"
                    }>
                    <Switch
                        id="set-raw-data"
                        checked={Settings.jsonDownload.rawData}
                        onChange={(rawData) =>
                            updateSettings({ jsonDownload: { rawData } })
                        }
                    />
                </Row>
            </Group>
            <Group title="Incremental" beta>
                <Row
                    label="Only new since last"
                    tooltip="BETA. Album, chat and group downloads fetch only content newer than your last successful download, remembered per Nomi/group. Use Reset to download everything again."
                    htmlFor="set-incremental"
                    hint={
                        Settings.incremental.enabled
                            ? "Only newer content"
                            : "Always full download"
                    }>
                    <Switch
                        id="set-incremental"
                        checked={Settings.incremental.enabled}
                        onChange={(enabled) => {
                            setHistoryCleared(false);
                            updateSettings({ incremental: { enabled } });
                        }}
                    />
                </Row>
                <Row
                    label="Download history"
                    htmlFor="set-incremental-reset"
                    hint={
                        historyCleared
                            ? "History cleared"
                            : "Forget what was downloaded"
                    }>
                    <button
                        id="set-incremental-reset"
                        type="button"
                        onClick={async () => {
                            await clearIncremental();
                            setHistoryCleared(true);
                        }}>
                        Reset history
                    </button>
                </Row>
            </Group>
        </>
    );
};
