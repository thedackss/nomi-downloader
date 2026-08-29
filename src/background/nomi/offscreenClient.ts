import { Log } from "../../utils/log";
import type { ChatRenderPayload } from "./chat/types";
import {
    BLOB_URL_REVOKE_DELAY_MS,
    FALLBACK_REVOKE_DELAY_MS,
    OFFSCREEN_DOCUMENT_PATH,
} from "./constants";
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
        // The Firefox build has no offscreen API, so __IS_FIREFOX__ lets this
        // whole block dead-code-eliminate out of that bundle.
        if (!__IS_FIREFOX__) {
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

            // createDocument() resolves before the document's script registers
            // its onMessage listener, so the first message can be lost to a race
            // (the render returns no response). Ping keep-alive until the
            // listener answers before handing back control.
            await this.waitUntilReady();
        }
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
     * Save a file. The downloads API is tried first wherever it exists and
     * its outcome is VERIFIED (it hands back an id we can watch), because on
     * Firefox Android the click-an-anchor fallbacks "succeed" silently while
     * saving nothing — a user on Fenix reported exports that claimed success
     * with no file to show. Unverifiable paths (page save, anchor) remain as
     * desktop fallbacks only; on Android a failed save now honestly opens the
     * file in a tab instead of lying. Blob URLs are revoked afterward.
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

        // Firefox (background is a DOM page); Chrome's worker skips to the
        // downloads API below.
        if (typeof document !== "undefined") {
            report?.("Saving file…");
            // Verified save through the downloads API, when it exists.
            if (await this.verifiedApiDownload(url, filename, saveAs)) {
                Log(`Saved "${filename}" via the downloads API (verified)`);
                report?.("Saved to your downloads");
                this.scheduleRevoke(url, isBlob, false);
                return { ok: true, openedTab: false };
            }
            const isAndroid =
                typeof navigator !== "undefined" &&
                /Android/i.test(navigator.userAgent);
            if (!isAndroid) {
                // Desktop-only fallbacks: neither can report failure, but on
                // desktop they reliably work; on Android they silently no-op,
                // which must not be reported as success.
                if (await this.saveViaPage(url, filename)) {
                    Log(`Saved "${filename}" via the page`);
                    report?.("Saved to your downloads");
                    this.scheduleRevoke(url, isBlob, false);
                    return { ok: true, openedTab: false };
                }
                try {
                    this.anchorDownload(url, filename);
                    Log(`Saved "${filename}" via background anchor`);
                    report?.("Saved to your downloads");
                    this.scheduleRevoke(url, isBlob, false);
                    return { ok: true, openedTab: false };
                } catch (err) {
                    Log("Background anchor download failed", err);
                }
            }
            // Fall through to the tab fallback below, honestly.
            try {
                await chrome.tabs.create({ url });
                openedTab = true;
                note = `Couldn't save directly — the file opened in a tab; save it from the browser menu`;
                report?.(note);
            } catch (tabErr) {
                Log("Failed to open the download in a tab", tabErr);
                note = "Download failed";
                report?.(note);
            }
            this.scheduleRevoke(url, isBlob, openedTab);
            return { ok: false, openedTab, note };
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

    /**
     * Start a download through the downloads API and wait until it verifiably
     * starts (bytes flowing, or already complete). Resolves false when the
     * API is missing, throws, or the download reports "interrupted" or never
     * starts — the silent-failure mode on Firefox Android.
     */
    private async verifiedApiDownload(
        url: string,
        filename: string,
        saveAs: boolean,
    ): Promise<boolean> {
        if (typeof chrome === "undefined" || !chrome.downloads?.download) {
            return false;
        }
        try {
            const id = await chrome.downloads.download({
                url,
                filename,
                saveAs,
            });
            // Poll briefly: complete or visibly progressing counts as started.
            for (let attempt = 0; attempt < 10; attempt++) {
                await new Promise((r) => setTimeout(r, 300));
                const [item] = await chrome.downloads.search({ id });
                if (!item) continue;
                if (item.state === "complete") return true;
                if (item.state === "interrupted") {
                    Log(`Download interrupted: ${item.error ?? "unknown"}`);
                    return false;
                }
                if (item.state === "in_progress" && item.bytesReceived > 0) {
                    return true;
                }
            }
            Log("Download never started (no bytes after 3s)");
            return false;
        } catch (err) {
            Log("downloads API save failed", err);
            return false;
        }
    }

    /**
     * Hand the file to the nomi.ai page's content script, which triggers the
     * actual download from a live tab. Returns false (so the caller can fall
     * back) when there's no reachable nomi tab. The blob lives in this context,
     * so it's fetched back to bytes and sent as base64.
     */
    private async saveViaPage(url: string, filename: string): Promise<boolean> {
        if (typeof chrome === "undefined" || !chrome.tabs?.sendMessage) {
            return false;
        }
        try {
            let [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (!tab?.id || !/\bnomi\.ai\b/.test(tab.url ?? "")) {
                [tab] = await chrome.tabs.query({
                    url: "https://*.nomi.ai/*",
                });
            }
            if (!tab?.id) return false;

            const blob = await (await fetch(url)).blob();
            const base64 = await this.blobToBase64(blob);
            const res = await chrome.tabs.sendMessage(tab.id, {
                action: "SAVE_FILE",
                data: {
                    base64,
                    mime: blob.type || "application/octet-stream",
                    filename,
                },
            });
            return res?.ok === true;
        } catch (err) {
            Log("Page save failed", err);
            return false;
        }
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
