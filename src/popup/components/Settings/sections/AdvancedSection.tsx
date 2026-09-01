import { useSettings } from "../../../hooks/useSettings";
import { Group, Row, Switch } from "../controls";

// Per-type "Enable X download" toggles, grayed while advanced mode is off
// (the simple button ignores per-type choices).
type DownloadType =
    | "all"
    | "album"
    | "chat"
    | "mindMap"
    | "sharedNotes"
    | "json"
    | "markdown"
    | "chatMarkdown";

const TYPE_LABELS: Array<{ key: DownloadType; label: string }> = [
    { key: "all", label: "All (everything in one zip)" },
    { key: "album", label: "Album" },
    { key: "chat", label: "Chat" },
    { key: "mindMap", label: "Mind Map" },
    { key: "sharedNotes", label: "Shared Notes" },
    { key: "json", label: "JSON" },
    { key: "markdown", label: "Markdown" },
    { key: "chatMarkdown", label: "Chat Markdown" },
];

export const AdvancedSection = () => {
    const { Settings, updateSettings } = useSettings();
    const dl = Settings.download;

    return (
        <>
            <Row
                label="Separated Downloads"
                htmlFor="set-advanced-download"
                hint={
                    dl.advanced
                        ? "Pick which types appear on the button"
                        : "One button: everything in a single zip"
                }>
                <Switch
                    id="set-advanced-download"
                    checked={dl.advanced}
                    onChange={(advanced) =>
                        updateSettings({ download: { ...dl, advanced } })
                    }
                />
            </Row>
            <Group title="Download types">
                {TYPE_LABELS.map(({ key, label }) => (
                    <Row
                        key={key}
                        label={label}
                        htmlFor={`set-dl-${key}`}
                        disabled={!dl.advanced}>
                        <Switch
                            id={`set-dl-${key}`}
                            checked={dl[key]}
                            disabled={!dl.advanced}
                            onChange={(checked) =>
                                updateSettings({
                                    download: { ...dl, [key]: checked },
                                })
                            }
                        />
                    </Row>
                ))}
            </Group>
            <Group title="Other">
                <Row
                    label="Debug mode"
                    tooltip="Log verbose details to the console. Useful when reporting an issue."
                    htmlFor="set-debug"
                    hint={Settings.debug ? "Enabled" : "Disabled"}>
                    <Switch
                        id="set-debug"
                        checked={Settings.debug}
                        onChange={(debug) => updateSettings({ debug })}
                    />
                </Row>
            </Group>
        </>
    );
};
