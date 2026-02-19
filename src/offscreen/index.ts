// src/offscreen.ts
import JSZip from "jszip";

// Define message types
interface OffscreenMessage {
    type: string;
    target: string;
    data: any;
}

// Keep track of active zip instances
const zips: Record<string, JSZip> = {};

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
    zips[data.id] = new JSZip();
    sendResponse({ success: true });
}

function handleAddFile(
    data: { id: string; path: string; content: string }, // content is base64 string
    sendResponse: (res: any) => void,
) {
    const zip = zips[data.id];
    if (!zip) {
        sendResponse({ success: false, error: "Zip not found" });
        return;
    }

    try {
        // Blob is received as base64 string because Chrome message passing
        // supports JSON serialization mostly. However, passing ArrayBuffer is better.
        // But let's check if the sender is sending base64 or something else.
        // Actually, we can just receive the base64 string and put it into the zip with {base64: true}.
        zip.file(data.path, data.content, { base64: true });
        sendResponse({ success: true });
    } catch (err: any) {
        sendResponse({ success: false, error: err.message });
    }
}

async function handleGenerateZip(
    data: { id: string },
    sendResponse: (res: any) => void,
) {
    const zip = zips[data.id];
    if (!zip) {
        sendResponse({ success: false, error: "Zip not found" });
        return;
    }

    try {
        // Generate blob
        const blob = await zip.generateAsync({ type: "blob" });
        // Create blob URL
        const url = URL.createObjectURL(blob);

        sendResponse({ success: true, url });
    } catch (err: any) {
        sendResponse({ success: false, error: err.message });
    }
}

function handleClearZip(
    data: { id: string },
    sendResponse: (res: any) => void,
) {
    if (zips[data.id]) {
        delete zips[data.id];
    }
    // Also revoke object URLs if we kept track of them, but we pass them back
    // and let the browser clean up or manage manually?
    // Actually, blob URLs persist while the document is open.
    // We should probably revoke them eventually.
    // But since the background script uses them, maybe the background script can tell us when done?
    // Or just let them live until offscreen closes.

    sendResponse({ success: true });
}
