import type { ChatRenderPayload } from "./chat/types";
import { OFFSCREEN_DOCUMENT_PATH } from "./constants";
import type { MindMapRenderPayload } from "./mindmap/types";
import type { SharedNotesRenderPayload } from "./sharednotes/types";

export interface OffscreenPayload {
    id?: string;
    path?: string;
    content?: string;
    type?: string;
    url?: string;
}

export interface OffscreenResponse {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Bridges the MV3 service worker to the offscreen document that runs JSZip and
 * Blob APIs. When no offscreen context exists (e.g. tests, Firefox fallback) it
 * dispatches to the in-process zipService instead.
 */
export class OffscreenClient {
    async setupDocument(): Promise<void> {
        if (typeof chrome === "undefined" || !chrome.offscreen) return;
        if (!(await chrome.offscreen.hasDocument())) {
            await chrome.offscreen.createDocument({
                url: OFFSCREEN_DOCUMENT_PATH,
                reasons: [
                    chrome.offscreen.Reason.BLOBS,
                    chrome.offscreen.Reason.WORKERS,
                ],
                justification: "To generate ZIP files for download",
            });
        }

        // createDocument() resolves before the document's script registers its
        // onMessage listener, so the first message can be lost to a race (the
        // render returns no response). Ping keep-alive until the listener
        // answers before handing back control.
        await this.waitUntilReady();
    }

    private async waitUntilReady(): Promise<void> {
        for (let i = 0; i < 40; i++) {
            try {
                const res = await chrome.runtime.sendMessage({
                    target: "offscreen",
                    type: "keep-alive",
                });
                if (res === true) return;
            } catch {
                // Listener not up yet; retry after a short delay.
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    }

    async call(
        type: string,
        data: OffscreenPayload,
    ): Promise<OffscreenResponse> {
        if (typeof chrome !== "undefined" && chrome.offscreen) {
            return chrome.runtime.sendMessage({
                target: "offscreen",
                type,
                data,
            });
        }

        const { zipService } = await import("../../utils/zipService");
        switch (type) {
            case "create-zip":
                return zipService.createZip(data.id!);
            case "add-file":
                return zipService.addFile(data.id!, data.path!, data.content!);
            case "generate-zip":
                return zipService.generateZip(data.id!);
            case "clear-zip":
                return zipService.clearZip(data.id!);
            case "create-blob-url": {
                const blob = new Blob([data.content!], { type: data.type });
                // Firefox (no offscreen API) lands here, and it forbids
                // downloading data: URLs — so hand back a blob: URL where the
                // platform supports it, falling back to a data URI otherwise.
                if (typeof URL !== "undefined" && URL.createObjectURL) {
                    return { success: true, url: URL.createObjectURL(blob) };
                }
                const b64 = await this.blobToBase64(blob);
                return {
                    success: true,
                    url: `data:${data.type};base64,${b64}`,
                };
            }
            case "revoke-blob-url": {
                if (
                    data.url &&
                    typeof URL !== "undefined" &&
                    URL.revokeObjectURL
                ) {
                    URL.revokeObjectURL(data.url);
                }
                return { success: true };
            }
            default:
                throw new Error(`Unknown offscreen type: ${type}`);
        }
    }

    /**
     * Render the chat HTML in the offscreen document (which has a DOM), so
     * react-dom/server never loads in the service worker. Falls back to an
     * in-process render where there is no offscreen API (tests / Firefox page).
     */
    async renderChat(payload: ChatRenderPayload): Promise<string> {
        if (typeof chrome !== "undefined" && chrome.offscreen) {
            const res = await chrome.runtime.sendMessage({
                target: "offscreen",
                type: "render-chat",
                data: payload,
            });
            if (!res?.success || typeof res.html !== "string") {
                throw new Error(res?.error || "Failed to render chat");
            }
            return res.html;
        }

        const { renderChatPayload } = await import("./chat/ChatDocument");
        return renderChatPayload(payload);
    }

    /**
     * Render the mind map HTML in the offscreen document (which has a DOM), so
     * react-dom/server never loads in the service worker. Falls back to an
     * in-process render where there is no offscreen API (tests / Firefox page).
     */
    async renderMindMap(payload: MindMapRenderPayload): Promise<string> {
        if (typeof chrome !== "undefined" && chrome.offscreen) {
            const res = await chrome.runtime.sendMessage({
                target: "offscreen",
                type: "render-mindmap",
                data: payload,
            });
            if (!res?.success || typeof res.html !== "string") {
                throw new Error(res?.error || "Failed to render mind map");
            }
            return res.html;
        }

        const { renderMindMapPayload } = await import(
            "./mindmap/MindMapDocument"
        );
        return renderMindMapPayload(payload);
    }

    /**
     * Render the Shared Notes HTML in the offscreen document (which has a DOM),
     * so react-dom/server never loads in the service worker. Falls back to an
     * in-process render where there is no offscreen API (tests / Firefox page).
     */
    async renderSharedNotes(
        payload: SharedNotesRenderPayload,
    ): Promise<string> {
        if (typeof chrome !== "undefined" && chrome.offscreen) {
            const res = await chrome.runtime.sendMessage({
                target: "offscreen",
                type: "render-notes",
                data: payload,
            });
            if (!res?.success || typeof res.html !== "string") {
                throw new Error(res?.error || "Failed to render shared notes");
            }
            return res.html;
        }

        const { renderSharedNotesPayload } = await import(
            "./sharednotes/SharedNotesDocument"
        );
        return renderSharedNotesPayload(payload);
    }

    blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                resolve(base64data.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
