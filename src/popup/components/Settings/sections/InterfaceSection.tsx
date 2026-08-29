import { useSettings } from "../../../hooks/useSettings";
import { Row, Switch } from "../controls";

export const InterfaceSection = () => {
    const { Settings, updateSettings } = useSettings();

    return (
        <>
            <Row
                label="Layout"
                htmlFor="set-layout"
                hint="Auto follows the window shape.">
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
            </Row>
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
                label="Show stats"
                htmlFor="set-show-stats"
                hint={Settings.showStats ? "Daily usage shown" : "Hidden"}>
                <Switch
                    id="set-show-stats"
                    checked={Settings.showStats}
                    onChange={(showStats) => updateSettings({ showStats })}
                />
            </Row>
        </>
    );
};
