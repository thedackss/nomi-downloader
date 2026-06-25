// src/offscreen.ts
import { renderChatPayload } from "../background/nomi/chat/ChatDocument";
import type { ChatRenderPayload } from "../background/nomi/chat/types";
import { zipService } from "../utils/zipService";

// Define message types
type OffscreenMessage = { target: string } & (
    | { type: "create-zip"; data: { id: string } }
    | { type: "add-file"; data: { id: string; path: string; content: string } }
    | { type: "generate-zip"; data: { id: string } }
    | { type: "clear-zip"; data: { id: string } }
    | { type: "create-blob-url"; data: { content: string; type: string } }
    | { type: "revoke-blob-url"; data: { url: string } }
    | { type: "render-chat"; data: ChatRenderPayload }
    | { type: "keep-alive"; data?: undefined }
);

type SendResponse = (response?: unknown) => void;

chrome.runtime.onMessage.addListener(handleMessages);

function handleMessages(
    message: OffscreenMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: SendResponse,
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
        case "render-chat":
            handleRenderChat(message.data, sendResponse);
            break;
        case "keep-alive":
            sendResponse(true);
            break;
        default:
            console.warn(
                `Unknown message type: ${(message as { type: string }).type}`,
            );
    }
}

function handleRenderChat(data: ChatRenderPayload, sendResponse: SendResponse) {
    try {
        const html = renderChatPayload(data);
        sendResponse({ success: true, html });
    } catch (err) {
        sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

function handleCreateZip(data: { id: string }, sendResponse: SendResponse) {
    try {
        zipService.createZip(data.id);
        sendResponse({ success: true });
    } catch (err) {
        sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

function handleAddFile(
    data: { id: string; path: string; content: string }, // content is base64 string
    sendResponse: SendResponse,
) {
    try {
        zipService.addFile(data.id, data.path, data.content);
        sendResponse({ success: true });
    } catch (err) {
        sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

async function handleGenerateZip(
    data: { id: string },
    sendResponse: SendResponse,
) {
    try {
        const result = await zipService.generateZip(data.id);
        sendResponse(result);
    } catch (err) {
        sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

function handleClearZip(data: { id: string }, sendResponse: SendResponse) {
    try {
        zipService.clearZip(data.id);
        sendResponse({ success: true });
    } catch (err) {
        sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

function handleCreateBlobUrl(
    data: { content: string; type: string },
    sendResponse: SendResponse,
) {
    try {
        const blob = new Blob([data.content], { type: data.type });
        const url = URL.createObjectURL(blob);
        sendResponse({ success: true, url });
    } catch (err) {
        sendResponse({
            success: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

function handleRevokeBlobUrl(
    data: { url: string },
    sendResponse: SendResponse,
) {
    try {
        URL.revokeObjectURL(data.url);
        sendResponse({ success: true });
    } catch {
        // Can fail if url invalid, not big deal
        sendResponse({ success: true });
    }
}
