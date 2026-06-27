import { Log } from "../../utils/log";
import type { ChatRenderPayload } from "./chat/types";
import {
    BLOB_URL_REVOKE_DELAY_MS,
    FALLBACK_REVOKE_DELAY_MS,
    OFFSCREEN_DOCUMENT_PATH,
} from "./constants";
import type { MindMapRenderPayload } from "./mindmap/types";
import type { SharedNotesRenderPayload } from "./sharednotes/types";

/** Firefox for Android, where a background-page anchor click doesn't fire. */
function isAndroid(): boolean {
    return (
        typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)
    );
}

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

export interface DownloadResult {
    /** The browser saved the file directly. */
    ok: boolean;
    /** The file was opened in a tab because it couldn't be saved directly. */
    openedTab: boolean;
    /** A closing status message worth surfacing (e.g. the fallback reason). */
    note?: string;
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

    /**
     * Save a file via chrome.downloads, falling back to opening it in a tab if
     * the dispatch itself fails. The download promise resolves once the browser
     * accepts it (after the user picks a location on Firefox for Android, whose
     * save prompt the in-page UI keeps visible); we deliberately don't wait for
     * a "complete" event, since that signal is unreliable there and left the
     * status spinning. Blob URLs are revoked afterward.
     */
    async download(
        url: string,
        filename: string,
        options: { isBlob?: boolean; saveAs?: boolean } = {},
        report?: (message: string) => void,
    ): Promise<DownloadResult> {
        const { isBlob = false, saveAs = false } = options;
        let openedTab = false;
        let note: string | undefined;

        // Desktop Firefox runs the background as a DOM page; use an <a download>
        // there so it honors the browser's "ask where to save" setting (the
        // original method), instead of chrome.downloads silently auto-saving.
        // Android's background page doesn't fire the click, so it falls through
        // to the downloads API; Chrome's service worker has no document.
        if (typeof document !== "undefined" && !isAndroid()) {
            this.anchorDownload(url, filename);
            Log(`Saved "${filename}" via anchor`);
            report?.("Saved to your downloads");
            this.scheduleRevoke(url, isBlob, false);
            return { ok: true, openedTab: false };
        }

        try {
            if (typeof chrome === "undefined" || !chrome.downloads?.download) {
                throw new Error("downloads API unavailable");
            }
            report?.("Saving file…");
            await chrome.downloads.download({ url, filename, saveAs });
            Log(`Saved "${filename}"`);
            report?.("Saved to your downloads");
        } catch (err) {
            const reason = err instanceof Error ? err.message : "save failed";
            Log(`Save failed (${reason}); opening "${filename}" in a tab`);
            try {
                await chrome.tabs.create({ url });
                openedTab = true;
                note = `Opened in a tab (couldn't save directly) — save it from the browser menu`;
                report?.(note);
            } catch (tabErr) {
                Log("Failed to open the download in a tab", tabErr);
                note = `Download failed: ${reason}`;
                report?.(note);
            }
        }

        this.scheduleRevoke(url, isBlob, openedTab);

        return { ok: !openedTab, openedTab, note };
    }

    /** Trigger a download through a DOM anchor so the filename is honored and
     * the browser's save-location preference is respected. */
    private anchorDownload(url: string, filename: string): void {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    /** Revoke a blob URL after a delay (longer when a fallback tab uses it). */
    private scheduleRevoke(url: string, isBlob: boolean, openedTab: boolean) {
        if (!isBlob) return;
        const delay = openedTab
            ? FALLBACK_REVOKE_DELAY_MS
            : BLOB_URL_REVOKE_DELAY_MS;
        setTimeout(() => {
            this.call("revoke-blob-url", { url }).catch(() => {});
        }, delay);
    }
}
