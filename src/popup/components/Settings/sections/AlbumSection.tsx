import { useSettings } from "../../../hooks/useSettings";
import { NumberInput, Row, Switch } from "../controls";

export const AlbumSection = () => {
    const { Settings, updateSettings } = useSettings();
    const album = Settings.albumDownload;

    const update = (patch: Partial<typeof album>) =>
        updateSettings({ albumDownload: { ...album, ...patch } });

    return (
        <>
            <Row
                label="Most recent photos"
                tooltip="0 = all. Set a number to download only the most recent N photos."
                htmlFor="set-recent-limit"
                hint={
                    album.recentLimit > 0
                        ? `Last ${album.recentLimit} photos`
                        : "All photos"
                }>
                <NumberInput
                    id="set-recent-limit"
                    step={50}
                    value={album.recentLimit}
                    onChange={(recentLimit) => update({ recentLimit })}
                />
            </Row>
            <Row
                label="Start at photo #"
                tooltip="0 = from the first. Skip to this position (oldest = #1) before applying the recent-photos limit."
                htmlFor="set-start-index"
                hint={
                    album.startIndex > 1
                        ? `From photo #${album.startIndex}`
                        : "From the first"
                }>
                <NumberInput
                    id="set-start-index"
                    step={50}
                    value={album.startIndex}
                    onChange={(startIndex) => update({ startIndex })}
                />
            </Row>
            <Row
                label="Concurrent downloads"
                tooltip="High values may cause performance issues"
                htmlFor="set-quantity"
                hint={`${album.downloadQuantity} at a time`}>
                <input
                    id="set-quantity"
                    type="range"
                    min={1}
                    max={10}
                    value={album.downloadQuantity}
                    onChange={(e) =>
                        update({
                            downloadQuantity: parseInt(e.target.value, 10),
                        })
                    }
                />
                <NumberInput
                    min={1}
                    max={50}
                    fallback={1}
                    value={album.downloadQuantity}
                    onChange={(downloadQuantity) =>
                        update({ downloadQuantity })
                    }
                />
            </Row>
            <Row
                label="Image quality"
                tooltip={
                    album.quality === "HD"
                        ? "HD quality may result in larger file sizes and longer download times"
                        : undefined
                }
                htmlFor="set-quality">
                <select
                    id="set-quality"
                    value={album.quality}
                    onChange={(e) =>
                        update({ quality: e.target.value as "HD" | "SD" })
                    }>
                    <option value="HD">HD</option>
                    <option value="SD">SD</option>
                </select>
            </Row>
            <Row
                label="Images per zip"
                tooltip="0 = auto (split only when a zip gets too large). Set a number to cap how many images each zip holds."
                htmlFor="set-images-per-zip"
                hint={
                    album.imagesPerZip > 0
                        ? `${album.imagesPerZip} per zip`
                        : "Auto (split by size)"
                }>
                <NumberInput
                    id="set-images-per-zip"
                    step={100}
                    value={album.imagesPerZip}
                    onChange={(imagesPerZip) => update({ imagesPerZip })}
                />
            </Row>
            <Row
                label="Max zip size (MB)"
                tooltip="Zips split into parts when their estimated size passes this — albums, bundles, and chat zips with voice audio. Built in memory, so very large values may fail. Default 750."
                htmlFor="set-max-zip-size"
                hint={`~${album.maxZipSizeMB} MB per zip`}>
                <NumberInput
                    id="set-max-zip-size"
                    min={100}
                    step={250}
                    fallback={750}
                    value={album.maxZipSizeMB}
                    onChange={(maxZipSizeMB) => update({ maxZipSizeMB })}
                />
            </Row>
            <Row
                label="Organize into folders"
                htmlFor="set-folders"
                hint={album.folderization ? "Enabled" : "Disabled"}>
                <Switch
                    id="set-folders"
                    checked={album.folderization}
                    onChange={(folderization) => update({ folderization })}
                />
            </Row>
            <Row
                label="Prompt files"
                tooltip="Save the generation prompt for Art and edited photos. Embedding writes into the image metadata (PNG/HD only); WebP and videos always use a sidecar .txt."
                htmlFor="set-prompts">
                <select
                    id="set-prompts"
                    value={album.prompts}
                    onChange={(e) =>
                        update({
                            prompts: e.target.value as
                                | "off"
                                | "sidecar"
                                | "embed"
                                | "both",
                        })
                    }>
                    <option value="off">Off</option>
                    <option value="sidecar">Sidecar .txt</option>
                    <option value="embed">Image metadata</option>
                    <option value="both">Both</option>
                </select>
            </Row>
        </>
    );
};
