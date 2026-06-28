import { useEffect, useState } from "react";
import type { DownloadStatus } from "../components/Info/interfaces";
import { useNomi } from "./useNomi";
import { useSettings } from "./useSettings";

const INITIAL_STATUS: DownloadStatus = {
    inProgress: false,
    message: "You shouldn't be able to see this message",
    id: null,
    type: null,
};

/**
 * Talks to the background service worker: dispatches download requests for the
 * currently selected Nomi and tracks the broadcast download status. Lets the
 * Info components pull what they need instead of drilling handlers as props.
 */
export function useBackground() {
    const { Nomis } = useNomi();
    const { Settings } = useSettings();
    const nomi = Nomis.selected.nomi;
    const group = Nomis.selected.group;

    const [downloadStatus, setDownloadStatus] =
        useState<DownloadStatus>(INITIAL_STATUS);

    // Pick up any download already running when this mounts.
    useEffect(() => {
        let cancelled = false;
        chrome.runtime
            .sendMessage({ type: "GET_DOWNLOAD_STATUS" })
            .then((status: DownloadStatus | undefined) => {
                if (!cancelled && status) setDownloadStatus(status);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    // Stay in sync with progress broadcasts from the worker.
    useEffect(() => {
        const handleMessage = (message: {
            type?: string;
            status?: DownloadStatus;
        }) => {
            if (message?.type === "DOWNLOAD_STATUS_UPDATE" && message.status) {
                setDownloadStatus(message.status);
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    function startDownload(
        type: string,
        message: string,
        extraData?: Record<string, unknown>,
    ) {
        if (!nomi) return;
        chrome.runtime.sendMessage({
            type,
            data: {
                nomiId: nomi.id,
                debug: Settings.debug,
                embedHeaderVideo: Settings.download.embedHeaderVideo,
                ...extraData,
            },
        });
        // Optimistic update; the background broadcasts real progress.
        setDownloadStatus({
            inProgress: true,
            message,
            id: nomi.id,
            type: "nomi",
        });
    }

    function startGroupDownload(
        type: string,
        message: string,
        extraData?: Record<string, unknown>,
    ) {
        if (!group) return;
        chrome.runtime.sendMessage({
            type,
            data: {
                groupId: group.id,
                debug: Settings.debug,
                embedHeaderVideo: Settings.download.embedHeaderVideo,
                ...extraData,
            },
        });
        // Optimistic update; the background broadcasts real progress.
        setDownloadStatus({
            inProgress: true,
            message,
            id: group.id,
            type: "group",
        });
    }

    const albumOptions = {
        downloadQuantity: Settings.albumDownload.downloadQuantity,
        folderization: Settings.albumDownload.folderization,
        quality: Settings.albumDownload.quality,
        imagesPerZip: Settings.albumDownload.imagesPerZip,
        maxZipSizeMB: Settings.albumDownload.maxZipSizeMB,
        prompts: Settings.albumDownload.prompts,
        recentLimit: Settings.albumDownload.recentLimit,
        startIndex: Settings.albumDownload.startIndex,
        incremental: Settings.incremental.enabled,
    };
    const chatOptions = {
        maxMessages: Settings.chatDownload.maxMessages,
        rangeStart: Settings.chatDownload.rangeStart,
        rangeEnd: Settings.chatDownload.rangeEnd,
        messagesPerFile: Settings.chatDownload.messagesPerFile,
        maxFileSizeMB: Settings.chatDownload.maxFileSizeMB,
        includeSelfies: Settings.chatDownload.includeSelfies,
        incremental: Settings.incremental.enabled,
    };
    const jsonOptions = {
        rawData: Settings.jsonDownload.rawData,
    };

    // Shared payload identifying the selected group for any group export.
    const groupPayload = group && {
        name: group.name,
        info: {
            type: group.type,
            created: group.created,
            imageStyle: group.artSettings.imageStyle,
            members: group.nomis.map((n) => n.name),
        },
    };

    return {
        downloadStatus,
        // Non-advanced one-click download: album + chat + shared notes.
        downloadSimple: () =>
            startDownload("DOWNLOAD_SIMPLE", "Starting download...", {
                ...albumOptions,
                ...chatOptions,
            }),
        downloadAll: () =>
            startDownload("DOWNLOAD_ALL", "Starting download...", {
                ...albumOptions,
                ...chatOptions,
                ...jsonOptions,
            }),
        downloadAlbum: () =>
            startDownload(
                "DOWNLOAD_ALBUM",
                "Starting download...",
                albumOptions,
            ),
        downloadChat: () =>
            startDownload(
                "DOWNLOAD_CHAT",
                "Starting chat download...",
                chatOptions,
            ),
        downloadMind: () =>
            startDownload("DOWNLOAD_MIND", "Starting mind download..."),
        downloadBackstory: () =>
            startDownload(
                "DOWNLOAD_BACKSTORY",
                "Starting shared notes download...",
            ),
        downloadJSON: () =>
            startDownload(
                "DOWNLOAD_JSON",
                "Starting JSON download...",
                jsonOptions,
            ),
        downloadMarkdown: () =>
            startDownload("DOWNLOAD_MARKDOWN", "Starting Markdown download..."),
        downloadGroupChat: () =>
            startGroupDownload(
                "DOWNLOAD_GROUP_CHAT",
                "Starting group chat download...",
                { ...groupPayload, ...chatOptions },
            ),
        downloadGroupJson: () =>
            startGroupDownload(
                "DOWNLOAD_GROUP_JSON",
                "Starting JSON download...",
                { ...groupPayload, ...jsonOptions },
            ),
        downloadGroupMarkdown: () =>
            startGroupDownload(
                "DOWNLOAD_GROUP_MARKDOWN",
                "Starting Markdown download...",
                { ...groupPayload },
            ),
    };
}
