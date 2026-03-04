// src/offscreen.ts
import { zipService } from "../utils/zipService";

// Define message types
interface OffscreenMessage {
    type: string;
    target: string;
    data: any;
}

chrome.runtime.onMessage.addListener(handleMessages);

function handleMessages(
    message: OffscreenMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
) {
    if (message.target !== "offscreen") return;

    switch (message.type) {
        case "create-zip":
            handleCreateZip(message.data, sendResponse);
            break;
        case "add-file":
            handleAddFile(message.data, sendResponse);
            break;
        case "generate-zip":
            handleGenerateZip(message.data, sendResponse);
            return true; // async response
        case "clear-zip":
            handleClearZip(message.data, sendResponse);
            break;
        case "create-blob-url":
            handleCreateBlobUrl(message.data, sendResponse);
            break;
        case "revoke-blob-url":
            handleRevokeBlobUrl(message.data, sendResponse);
            break;
        case "keep-alive":
            sendResponse(true);
            break;
        default:
            console.warn(`Unknown message type: ${message.type}`);
    }
}

function handleCreateZip(
    data: { id: string },
    sendResponse: (res: any) => void,
) {
    try {
        zipService.createZip(data.id);
        sendResponse({ success: true });
    } catch (err: any) {
        sendResponse({ success: false, error: err.message });
    }
}

function handleAddFile(
    data: { id: string; path: string; content: string }, // content is base64 string
    sendResponse: (res: any) => void,
) {
    try {
        zipService.addFile(data.id, data.path, data.content);
        sendResponse({ success: true });
    } catch (err: any) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleGenerateZip(
    data: { id: string },
    sendResponse: (res: any) => void,
) {
    try {
        const result = await zipService.generateZip(data.id);
        sendResponse(result);
    } catch (err: any) {
        sendResponse({ success: false, error: err.message });
    }
}

function handleClearZip(
    data: { id: string },
    sendResponse: (res: any) => void,
) {
    try {
        zipService.clearZip(data.id);
        sendResponse({ success: true });
    } catch (err: any) {
        sendResponse({ success: false, error: err.message });
    }
}

function handleCreateBlobUrl(
    data: { content: string; type: string },
    sendResponse: (res: any) => void,
) {
    try {
        const blob = new Blob([data.content], { type: data.type });
        const url = URL.createObjectURL(blob);
        sendResponse({ success: true, url });
    } catch (err: any) {
        sendResponse({ success: false, error: err.message });
    }
}

function handleRevokeBlobUrl(
    data: { url: string },
    sendResponse: (res: any) => void,
) {
    try {
        URL.revokeObjectURL(data.url);
        sendResponse({ success: true });
    } catch (err: any) {
        // Can fail if url invalid, not big deal
        sendResponse({ success: true });
    }
}
