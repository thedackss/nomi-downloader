import { useSettings } from "../../../hooks/useSettings";
import { Group, NumberInput, Row, Switch } from "../controls";

export const ChatSection = () => {
    const { Settings, updateSettings } = useSettings();
    const chat = Settings.chatDownload;

    const update = (patch: Partial<typeof chat>) =>
        updateSettings({ chatDownload: { ...chat, ...patch } });

    return (
        <>
            <Row
                label="Max messages"
                tooltip="0 = unlimited. Set a number to export only the most recent N. Counts timeline items, so a few selfie blocks may be included."
                htmlFor="set-max-messages"
                hint={
                    chat.maxMessages > 0
                        ? `Last ${chat.maxMessages} messages`
                        : "All messages"
                }>
                <NumberInput
                    id="set-max-messages"
                    step={50}
                    value={chat.maxMessages}
                    onChange={(maxMessages) => update({ maxMessages })}
                />
            </Row>
            <Row
                label="Message range"
                tooltip="Export an explicit range (oldest = #1, inclusive). 0 = open end. When set, this overrides Max messages."
                htmlFor="set-range-start"
                hint={
                    chat.rangeStart > 0 || chat.rangeEnd > 0
                        ? `Messages #${chat.rangeStart || 1} to ${
                              chat.rangeEnd || "end"
                          }`
                        : "Full range (uses Max messages)"
                }>
                <NumberInput
                    id="set-range-start"
                    step={50}
                    placeholder="From #"
                    value={chat.rangeStart}
                    onChange={(rangeStart) => update({ rangeStart })}
                />
                <NumberInput
                    id="set-range-end"
                    step={50}
                    placeholder="To #"
                    value={chat.rangeEnd}
                    onChange={(rangeEnd) => update({ rangeEnd })}
                />
            </Row>
            <Row
                label="Messages per file"
                tooltip="0 = no limit. Split the export into HTML files of at most this many messages each (the size cap below still applies)."
                htmlFor="set-messages-per-file"
                hint={
                    chat.messagesPerFile > 0
                        ? `${chat.messagesPerFile} per file`
                        : "No limit (size only)"
                }>
                <NumberInput
                    id="set-messages-per-file"
                    step={500}
                    value={chat.messagesPerFile}
                    onChange={(messagesPerFile) => update({ messagesPerFile })}
                />
            </Row>
            <Row
                label="Max file size (MB)"
                tooltip="0 = built-in safe cap (10 MB text / 75 MB with selfies). The file is built in memory, so very large values may fail. Raise it to split less often."
                htmlFor="set-chat-max-size"
                hint={
                    chat.maxFileSizeMB > 0
                        ? `~${chat.maxFileSizeMB} MB per file`
                        : "Auto (safe default)"
                }>
                <NumberInput
                    id="set-chat-max-size"
                    step={10}
                    value={chat.maxFileSizeMB}
                    onChange={(maxFileSizeMB) => update({ maxFileSizeMB })}
                />
            </Row>
            <Row
                label="Include selfies"
                htmlFor="set-include-selfies"
                hint={chat.includeSelfies ? "Embedded in chat" : "Text only"}>
                <Switch
                    id="set-include-selfies"
                    checked={chat.includeSelfies}
                    onChange={(includeSelfies) => update({ includeSelfies })}
                />
            </Row>
            <Group title="Voice">
                <Row
                    label="Voice audio"
                    tooltip="Saves each voice message's audio with the export. The chat download becomes a zip (chat + voice files) with playback built into the HTML; bundles get a voice folder. Audio files are large."
                    htmlFor="set-voice-audio"
                    hint={
                        chat.includeVoiceAudio
                            ? "Audio included (zip)"
                            : "Transcripts only"
                    }>
                    <Switch
                        id="set-voice-audio"
                        checked={chat.includeVoiceAudio}
                        onChange={(includeVoiceAudio) =>
                            update({ includeVoiceAudio })
                        }
                    />
                </Row>
            </Group>
        </>
    );
};
