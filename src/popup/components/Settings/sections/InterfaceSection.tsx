import { useSettings } from "../../../hooks/useSettings";
import { Row, Switch } from "../controls";

export const InterfaceSection = () => {
    const { Settings, updateSettings } = useSettings();

    return (
        <>
            <Row
                label="Icon shape"
                htmlFor="set-icon-shape"
                hint="How Nomi avatars are framed in the list.">
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
            </Row>
            <Row
                label="Icon size"
                htmlFor="set-icon-size"
                hint="Size of the avatars in the list.">
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
            </Row>
            <Row
                label="Text size"
                htmlFor="set-text-size"
                hint="Scales all text in the popup.">
                <select
                    id="set-text-size"
                    value={Settings.textSize}
                    onChange={(e) =>
                        updateSettings({
                            textSize: e.target.value as
                                | "normal"
                                | "large"
                                | "xlarge",
                        })
                    }>
                    <option value="normal">Normal</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra large</option>
                </select>
            </Row>
            <Row
                label="Show stats"
                htmlFor="set-show-stats"
                hint={Settings.showStats ? "Daily usage shown" : "Hidden"}>
                <Switch
                    id="set-show-stats"
                    checked={Settings.showStats}
                    onChange={(showStats) => updateSettings({ showStats })}
                />
            </Row>
            <Row
                label="Sync stats"
                tooltip="Sends your daily counters (messages sent/received, selfies) to nomi.zar.mx, keyed by your account's public id, so your history survives reinstalls. Counters only, never content. Off = nothing is ever sent."
                htmlFor="set-stats-sync"
                disabled={!Settings.showStats}
                hint={
                    Settings.statsSync
                        ? "Counters synced to nomi.zar.mx"
                        : "Stats stay on this device"
                }>
                <Switch
                    id="set-stats-sync"
                    checked={Settings.statsSync}
                    disabled={!Settings.showStats}
                    onChange={(statsSync) => updateSettings({ statsSync })}
                />
            </Row>
        </>
    );
};
