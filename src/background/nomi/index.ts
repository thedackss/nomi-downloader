import type { ApiNomisIdResponse } from "../../interfaces/nomi/api.nomis.id";
import type { NomiExistsProps } from "./interfaces/exists";
import { api } from "../../utils/nomiApi";
import { Log } from "../../utils/log";
import type {
    ApiNomisMessagesResponse,
    Message,
    SelfieRequest,
} from "../../interfaces/nomi/api.nomis.id.chat";
import type {
    APINomisIDMediasResponse,
    Media,
} from "../../interfaces/nomi/api.nomis.id.medias";
import type { GetMediasProps } from "./interfaces/getMedias";
import type { DownloadAlbumProps } from "./interfaces/downloadAlbum";
import type { DownloadChatProps } from "./interfaces/downloadChat";
import { ChatTemplate } from "./chatTemplate";

interface NomiErrorProps {
    id?: number;
    message: string;
}

class NomiError extends Error {
    public id: number | null;
    public message: string;

    constructor({ id, message }: NomiErrorProps) {
        super(message);
        this.name = "Nomi Error";
        this.message = message;
        this.id = id ?? null;
    }
}

export class Nomi {
    constructor() {}

    private async exists({ nomiId }: NomiExistsProps) {
        try {
            Log("Checking if Nomi exists with ID: " + nomiId);
            await api.head("nomis/" + nomiId);

            return true;
        } catch (error) {
            throw new NomiError({
                id: nomiId,
                message: "Nomi with ID " + nomiId + " not found",
            });
        }
    }

    public async get({ nomiId }: NomiExistsProps) {
        try {
            Log("Getting Nomi with ID: " + nomiId);
            const { data } = await api.get<ApiNomisIdResponse>(
                "nomis/" + nomiId,
            );
            return data;
        } catch (error) {
            throw new NomiError({
                message: "Failed to get Nomi with ID " + nomiId,
            });
        }
    }

    public async getMessages({ nomiId }: NomiExistsProps) {
        Log("Getting messages for Nomi ID: " + nomiId);

        const exists = await this.exists({ nomiId });

        if (exists) {
            const messages: Message[] = [];
            const requests: SelfieRequest[] = [];

            let messagesFound = 0;
            let nextMax: string | undefined = "default";
            let url = `/nomis/${nomiId}/chat/messages`;

            try {
                while (nextMax) {
                    if (nextMax !== undefined && nextMax !== "default") {
                        url = `/nomis/${nomiId}/chat/messages?max=${nextMax}`;
                    }

                    const { data } =
                        await api.get<ApiNomisMessagesResponse>(url);

                    messages.push(...data.messages);
                    requests.push(...data.selfies);

                    nextMax = data.nextMax ?? undefined;
                    messagesFound += data.messages.length;
                }
            } catch (error) {
                Log(
                    "Error fetching messages for Nomi ID " + nomiId + ":",
                    error,
                );
            }

            const sorted = [...messages, ...requests].sort((a, b) => {
                const dateA =
                    "sent" in a ? new Date(a.sent) : new Date(a.completed);
                const dateB =
                    "sent" in b ? new Date(b.sent) : new Date(b.completed);

                return dateA.getTime() - dateB.getTime();
            });

            return sorted;
        } else {
            throw new NomiError({
                id: nomiId,
                message: "Nomi with ID " + nomiId + " does not exist",
            });
        }
    }

    public async getMedias({ nomiId, onProgress }: GetMediasProps) {
        Log("Getting media for Nomi ID: " + nomiId);

        const exists = await this.exists({ nomiId });

        const mediasUrl = `/nomis/${nomiId}/medias`;

        if (exists) {
            const { data } = await api.get<APINomisIDMediasResponse>(mediasUrl);

            const totalPages = data.maxPages;
            const selfies: Media[] = [];

            for (let i = 1; i <= totalPages; i++) {
                const url = `${mediasUrl}?page=${i}`;

                const { data } = await api.get<APINomisIDMediasResponse>(url);

                const newSelfies = data.medias;
                const totalFoundSoFar = selfies.length + newSelfies.length;

                // Determine increment step based on total count
                let step = 1;
                if (totalFoundSoFar > 500) step = 50;
                else if (totalFoundSoFar > 300) step = 20;
                else if (totalFoundSoFar > 100) step = 10;

                // Simulate smooth counting
                let currentCount = selfies.length;
                while (currentCount < totalFoundSoFar) {
                    const remaining = totalFoundSoFar - currentCount;

                    // Force step to 1 for the last 10 items
                    let currentStep = step;
                    let currentMs = 10;

                    if (i === totalPages) currentMs = 100;
                    if (remaining <= 50) currentStep = 5;
                    if (remaining <= 20) currentStep = 2;
                    if (remaining <= 10) currentStep = 1;

                    currentCount += currentStep;

                    if (currentCount > totalFoundSoFar)
                        currentCount = totalFoundSoFar;

                    const log = `[Scanning]: ${currentCount} selfies found...`;
                    if (onProgress) onProgress(log);

                    // Tiny delay to make it visible but not slow
                    await new Promise((resolve) =>
                        setTimeout(resolve, currentMs),
                    );
                }

                selfies.push(...newSelfies);
            }

            return selfies.sort((a, b) => {
                const dateA = new Date(a.completed);
                const dateB = new Date(b.completed);

                return dateA.getTime() - dateB.getTime();
            });
        } else {
            throw new NomiError({
                id: nomiId,
                message: "Nomi with ID " + nomiId + " does not exist",
            });
        }
    }

    private async setupOffscreenDocument(path: string) {
        if (typeof chrome === "undefined" || !chrome.offscreen) {
            return;
        }

        if (await chrome.offscreen.hasDocument()) {
            return;
        }

        await chrome.offscreen.createDocument({
            url: path,
            reasons: [
                chrome.offscreen.Reason.BLOBS,
                chrome.offscreen.Reason.WORKERS,
            ],
            justification: "To generate ZIP files for download",
        });
    }

    private async callOffscreen(type: string, data: any) {
        if (typeof chrome !== "undefined" && chrome.offscreen) {
            return chrome.runtime.sendMessage({
                target: "offscreen",
                type,
                data,
            });
        } else {
            const { zipService } = await import("../../utils/zipService");
            switch (type) {
                case "create-zip":
                    return zipService.createZip(data.id);
                case "add-file":
                    return zipService.addFile(data.id, data.path, data.content);
                case "generate-zip":
                    return zipService.generateZip(data.id);
                case "clear-zip":
                    return zipService.clearZip(data.id);
                case "create-blob-url":
                    // Fallback for non-offscreen context (if necessary, though logic is weird here)
                    // The whole point is to avoid this, but if offscreen is missing:
                    const blob = new Blob([data.content], { type: data.type });
                    return this.blobToBase64(blob).then((b64) => ({
                        success: true,
                        url: `data:${data.type};base64,${b64}`,
                    }));
                case "revoke-blob-url":
                    return { success: true };
                default:
                    throw new Error(`Unknown offscreen type: ${type}`);
            }
        }
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const base64 = base64data.split(",")[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    public async downloadAlbum({
        nomiId,
        onProgress,
        quality = "HD",
        folderization = false,
        downloadQuantity = 20,
    }: DownloadAlbumProps) {
        try {
            await this.setupOffscreenDocument("src/offscreen/index.html");

            Log("Downloading album for Nomi ID: " + nomiId);
            const qualityBasedExtension = quality === "HD" ? "png" : "webp";

            function update(message: string) {
                if (onProgress) onProgress(message);
            }

            update("Checking if Nomi exists...");

            // Get Nomi details for the filename
            const nomi = await this.get({ nomiId });
            const nomiName = nomi.name || `Nomi_${nomiId}`;

            const medias = await this.getMedias({
                nomiId,
                onProgress,
            });

            if (medias.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: "No media found for Nomi with ID " + nomiId,
                });
            }

            const estimateMediaSize = (media: Media) => {
                let size = 0;

                // HD Photo ~2MB
                if (media.type === "Photo" || media.type === "Art")
                    if (quality === "HD") size = 2 * 1024 * 1024;
                    else size = 0.1 * 1024 * 1024;
                // PhotoEdit ~2MB
                else if (media.mediaType === "ImageEditRequest")
                    if (quality === "HD") size = 2 * 1024 * 1024;
                    else size = 0.1 * 1024 * 1024;
                // Video ~5MB
                else if (media.mediaType === "VideoRequest")
                    size = 5 * 1024 * 1024;
                // Default ~1MB
                else size = 1 * 1024 * 1024;

                return size;
            };

            function chunkMedias(
                medias: Media[],
                maxBytesPerChunk = 750 * 1024 * 1024,
            ) {
                const chunks: Media[][] = [];
                let currentChunk: Media[] = [];
                let currentSize = 0;

                for (const media of medias) {
                    const size = estimateMediaSize(media);

                    if (
                        currentSize + size > maxBytesPerChunk &&
                        currentChunk.length > 0
                    ) {
                        chunks.push(currentChunk);
                        currentChunk = [];
                        currentSize = 0;
                    }

                    currentChunk.push(media);
                    currentSize += size;
                }

                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                }

                return chunks;
            }

            const chunks = chunkMedias(medias);
            const downloads: { url: string; filename: string }[] = [];

            for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                const chunk = chunks[chunkIndex];
                const chunkId = `chunk_${chunkIndex}_${Date.now()}`;

                // Create ZIP in offscreen (or locally via helper)
                await this.callOffscreen("create-zip", { id: chunkId });

                let chunkMesage = `Chunk ${chunkIndex + 1}/${chunks.length}, `;
                if (chunks.length < 2) chunkMesage = "";

                update(
                    `[Processing]: ${chunkMesage}${chunk.length} media items`,
                );

                const processMedia = async (media: Media, i: number) => {
                    type MediaType = "Photo" | "Video" | "Art" | "PhotoEdit";

                    let type: MediaType = "Photo";
                    let isMp4 = false;
                    let url = "";

                    // Determine media type
                    if (media.type) {
                        if (media.type === "Art") type = "Art";
                        else if (media.type === "Photo") type = "Photo";
                    }

                    if (media.mediaType === "VideoRequest") type = "Video";
                    else if (media.mediaType === "ImageEditRequest")
                        type = "PhotoEdit";

                    // Determine URL based on type
                    if (type === "Photo" || type === "Art") {
                        url = `/selfie-requests/${media.selfieRequestId}/images/${media.id}.${qualityBasedExtension}`;
                    } else if (type === "Video") {
                        const mp4Url = `/video-requests/${media.uuid}.mp4`;
                        const webpUrl = `/video-requests/${media.uuid}.webp`;
                        try {
                            await api.head(mp4Url);
                            url = mp4Url;
                            isMp4 = true;
                        } catch {
                            url = webpUrl;
                        }
                    } else if (type === "PhotoEdit") {
                        url = `/image-edit-requests/${media.uuid}/edited-image.${qualityBasedExtension}`;
                    }

                    const stringDate = new Date(media.completed)
                        .toISOString()
                        .split("T")[0];

                    const chunkOffset = chunks
                        .slice(0, chunkIndex)
                        .reduce((acc, c) => acc + c.length, 0);

                    // Ensure index is unique across chunks by adding offset
                    const globalIndex = i + chunkOffset;

                    function getPath(mediaType: MediaType) {
                        let ext: string = qualityBasedExtension;

                        if (mediaType === "Video") {
                            if (isMp4) ext = "mp4";
                            else ext = "webp";
                        }

                        // If Nomi.name is static or inherited, access it properly.
                        const baseName = `nomi_${nomiId}`;
                        const folder = mediaType.toLowerCase();
                        const path = `${baseName}_${globalIndex}_${stringDate}.${ext}`;

                        if (folderization) return `${folder}/${path}`;
                        else return path;
                    }

                    update(
                        `[Processing]: ${chunkMesage}Downloading media ${globalIndex + 1}/${medias.length}`,
                    );

                    try {
                        // Increase timeout for large HD files
                        const { data } = await api.get(url, {
                            responseType: "blob",
                            timeout: 60000, // 60 seconds timeout
                        });

                        const base64 = await this.blobToBase64(data);

                        // Send file to offscreen ZIP
                        await this.callOffscreen("add-file", {
                            id: chunkId,
                            path: getPath(type),
                            content: base64,
                        });
                    } catch (error) {
                        update(
                            `[Processing]: ${chunkMesage}Error downloading media ${globalIndex + 1}/${medias.length}, skipping`,
                        );

                        Log(
                            `Failed to download media ID ${media.id} from URL ${url}:`,
                            error,
                        );
                    }
                };

                for (let i = 0; i < chunk.length; i += downloadQuantity) {
                    const promises = [];
                    for (let j = 0; j < downloadQuantity; j++) {
                        const index = i + j;
                        if (index < chunk.length) {
                            promises.push(processMedia(chunk[index], index));
                        }
                    }

                    await Promise.all(promises);
                }

                // Generate ZIP in offscreen
                const response = await this.callOffscreen("generate-zip", {
                    id: chunkId,
                });

                if (response.success && response.url) {
                    // Format date: Thu-Feb-19-2026
                    const dateStr = new Date()
                        .toDateString()
                        .replace(/ /g, "-");

                    const ext = quality === "HD" ? "png" : "webp";
                    const count = medias.length;

                    // Only add part suffix if there are multiple chunks
                    const partSuffix =
                        chunks.length > 1 ? `_Part${chunkIndex + 1}` : "";

                    // Lexi_Media(360)_Thu-Feb-19-2026_(webp).zip
                    const filename = `${nomiName}_Album(${count})_${dateStr}_(${ext})${partSuffix}.zip`;

                    downloads.push({ url: response.url, filename });
                } else {
                    Log(
                        "Failed to generate zip for chunk " + (chunkIndex + 1),
                        response.error,
                    );
                }

                // Clear ZIP from offscreen memory (but keep blob URL valid)
                // Cleanup offscreen resource
                await this.callOffscreen("clear-zip", { id: chunkId });

                console.log(
                    `Chunk ${chunkIndex + 1} processed. Found ${medias.length} items.`,
                );
            }

            for (const download of downloads) {
                try {
                    await chrome.downloads.download({
                        url: download.url,
                        filename: download.filename,
                        saveAs: false,
                    });
                    // Adding a small delay to avoid browser hiccups when starting multiple downloads
                    await new Promise((resolve) => setTimeout(resolve, 500));
                } catch (err) {
                    Log("Download failed", err);
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            if (error instanceof NomiError) {
                Log("NomiError: " + error.message);
                if (onProgress) onProgress("Error: " + error.message);
            } else {
                Log("Unexpected error during album download:", error);
                if (onProgress)
                    onProgress("An unexpected error occurred during download.");
            }
        }
    }

    public async downloadChat({
        nomiId,
        includeSelfies,
        onProgress,
    }: DownloadChatProps) {
        try {
            Log("Downloading chat for Nomi ID: " + nomiId);
            const nomi = await this.get({ nomiId });
            const messages = await this.getMessages({ nomiId });

            if (!messages || messages.length === 0) {
                throw new NomiError({
                    id: nomiId,
                    message: "No messages found for Nomi with ID " + nomiId,
                });
            }

            const stringDate = new Date().toDateString().replace(/ /g, "-");
            const qualityBasedExtension = "webp"; // Default

            function update(message: string) {
                if (onProgress) onProgress(message);
            }

            update(`Scanning messages: ${messages.length} found`);

            const estimateItemSize = (item: Message | SelfieRequest) => {
                if ("sent" in item) {
                    return 1500;
                } else {
                    return includeSelfies ? item.selfies.length * 100_000 : 0;
                }
            };

            function chunkMessages(
                messages: (Message | SelfieRequest)[],
                maxCharsPerChunk = 10_000_000,
            ) {
                const chunks: (Message | SelfieRequest)[][] = [];
                let currentChunk: (Message | SelfieRequest)[] = [];
                let currentSize = 0;

                for (const item of messages) {
                    const itemSize = estimateItemSize(item);

                    if (
                        currentSize + itemSize > maxCharsPerChunk &&
                        currentChunk.length > 0
                    ) {
                        chunks.push(currentChunk);
                        currentChunk = [];
                        currentSize = 0;
                    }

                    currentChunk.push(item);
                    currentSize += itemSize;
                }

                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                }

                return chunks;
            }

            // If including selfies, use larger chunks to avoid too many files, but limit by size
            // If text only, 10MB fits a LOT of text
            const chunks = chunkMessages(
                messages,
                includeSelfies ? 75_000_000 : 10_000_000,
            );

            update(`Downloading ${messages.length} messages... 0%`);

            let lastPercent = "0";
            let messagesCount = 0;
            let currentMessageIndex = 0;

            const msgTemplate = (isNomi: boolean, msg: string, date: Date) => {
                const className = isNomi ? "nomi" : "user";
                const day = date.toDateString();
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                const time = `${hours}:${minutes}`;

                return `<li class='msg ${className}'>${msg}</li><li class='detail ${className}'>${day} ${time}</li>`;
            };

            const HTML_TEMPLATE = ChatTemplate;

            for (let j = 0; j < chunks.length; j++) {
                const chunk = chunks[j];
                let messageList = "";

                for (let i = 0; i < chunk.length; i++) {
                    const element = chunk[i];
                    const isMessage = "sent" in element;

                    const percentage = (
                        ((messagesCount + 1) / messages.length) *
                        100
                    ).toFixed(0);

                    if (percentage !== lastPercent) {
                        update(`Downloading messages... ${percentage}%`);
                    }
                    lastPercent = percentage;
                    messagesCount++;

                    if (isMessage) {
                        const message = element as Message;
                        const isNomi =
                            message.type === "Nomi" ||
                            message.type === "NomiStarter";
                        const date = new Date(message.sent);

                        // Handle potential HTML content or sanitize if needed, but for now assuming text
                        messageList += msgTemplate(isNomi, message.text, date);
                    } else if (includeSelfies) {
                        const request = element as SelfieRequest;
                        const selfies = request.selfies;

                        for (let k = 0; k < selfies.length; k++) {
                            const selfie = selfies[k];
                            // Use the standard endpoint format
                            const url = `/selfie-requests/${request.id}/images/${selfie.id}.${qualityBasedExtension}`;

                            try {
                                const { data } = await api.get(url, {
                                    responseType: "blob",
                                    timeout: 30000,
                                });

                                const base64 = await this.blobToBase64(data);
                                messageList += `<img onclick="openImage(this.src)" src='data:image/${qualityBasedExtension};base64,${base64}' />`;
                            } catch (err) {
                                Log(`Failed to fetch selfie ${selfie.id}`, err);
                                messageList += `<li class='msg result'>[Image Download Failed]</li>`;
                            }
                        }
                    }
                }

                // Use Data URI for download since URL.createObjectURL is not available in Service Worker
                const chatHtml = HTML_TEMPLATE.replace(
                    "{messages}",
                    messageList,
                );

                // For very large chats, try to use Offscreen to create a Blob URL (safer for big strings).
                // Fallback to Data URI if that fails.
                let url = "";
                let isBlob = false;

                try {
                    await this.setupOffscreenDocument(
                        "src/offscreen/index.html",
                    );
                    const res = await this.callOffscreen("create-blob-url", {
                        content: chatHtml,
                        type: "text/html",
                    });

                    if (res?.success && res.url) {
                        url = res.url;
                        isBlob = true;
                    }
                } catch (e) {
                    // fallthrough to base64
                }

                if (!url) {
                    const base64Chat = btoa(
                        unescape(encodeURIComponent(chatHtml)),
                    );
                    url = `data:text/html;base64,${base64Chat}`;
                }

                const nomiNameSafe = nomi.name.replace(/ /g, "-");
                const count = messages.length;

                // Nomi_Chat(360)_Thu-Feb-19-2026.html
                let fileName = `${nomiNameSafe}_Chat(${count})_${stringDate}.html`;

                if (chunks.length > 1) {
                    const start = currentMessageIndex + 1;
                    const end = currentMessageIndex + chunk.length;
                    fileName = `${nomiNameSafe}_Chat(${start}-${end})_${stringDate}_Part${j + 1}.html`;
                }

                await chrome.downloads.download({
                    url: url,
                    filename: fileName,
                    saveAs: false,
                });

                // Small delay
                await new Promise((resolve) => setTimeout(resolve, 500));

                // Cleanup Blob URL in offscreen if we used one
                if (isBlob) {
                    setTimeout(() => {
                        this.callOffscreen("revoke-blob-url", { url });
                    }, 60000); // 1 min timeout to allow download to start
                }

                currentMessageIndex += chunk.length;
            }

            update(`Downloaded ${messages.length} messages`);
        } catch (error) {
            if (error instanceof NomiError) {
                Log("NomiError: " + error.message);
                if (onProgress) onProgress("Error: " + error.message);
            } else {
                Log("Unexpected error during chat download:", error);
                if (onProgress)
                    onProgress("Unexpected error during chat download.");
            }
        }
    }
}
