import { Log } from "../../utils/log";
import type { ChatRenderPayload } from "./chat/types";
import {
    BLOB_URL_REVOKE_DELAY_MS,
    DOWNLOAD_DISPATCH_TIMEOUT_MS,
    DOWNLOAD_TERMINAL_TIMEOUT_MS,
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
     * Save a file via chrome.downloads, confirming it actually completed and
     * falling back to opening the file in a tab when it doesn't. Firefox for
     * Android accepts the download but then interrupts blob-URL saves (and
     * never routes console logs to logcat), so the outcome is reported through
     * `report` to surface it in the popup. Blob URLs are revoked afterward
     * (later when a fallback tab still needs the URL).
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

        const outcome = await this.trySave(url, filename, saveAs);

        if (outcome.ok) {
            Log(`Saved "${filename}"`);
            report?.("Saved to your downloads");
        } else {
            Log(
                `Save failed (${outcome.reason}); opening "${filename}" in a tab`,
            );
            report?.(
                `Couldn't save automatically (${outcome.reason}); opening in a tab…`,
            );
            try {
                await chrome.tabs.create({ url });
                openedTab = true;
                note = `Opened in a tab (couldn't save directly: ${outcome.reason}) — save it from the browser menu`;
                report?.(note);
            } catch (tabErr) {
                Log("Failed to open the download in a tab", tabErr);
                note = `Download failed: ${outcome.reason}`;
                report?.(note);
            }
        }

        if (isBlob) {
            const delay = openedTab
                ? FALLBACK_REVOKE_DELAY_MS
                : BLOB_URL_REVOKE_DELAY_MS;
            setTimeout(() => {
                this.call("revoke-blob-url", { url }).catch(() => {});
            }, delay);
        }

        return { ok: outcome.ok, openedTab, note };
    }

    /** Dispatch a download and wait for its real terminal state. */
    private async trySave(
        url: string,
        filename: string,
        saveAs: boolean,
    ): Promise<{ ok: boolean; reason?: string }> {
        if (typeof chrome === "undefined" || !chrome.downloads?.download) {
            return { ok: false, reason: "downloads API unavailable" };
        }

        let id: number | undefined;
        try {
            id = await Promise.race([
                chrome.downloads.download({ url, filename, saveAs }),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error("dispatch timed out")),
                        DOWNLOAD_DISPATCH_TIMEOUT_MS,
                    ),
                ),
            ]);
        } catch (err) {
            return {
                ok: false,
                reason: err instanceof Error ? err.message : "dispatch failed",
            };
        }

        if (id == null) return { ok: false, reason: "no download id" };
        return this.awaitTerminal(id);
    }

    /**
     * Resolve once download `id` reaches complete or interrupted. Also queries
     * the current state so a download that finished before the listener
     * attached isn't missed, and times out rather than hanging forever.
     */
    private awaitTerminal(
        id: number,
    ): Promise<{ ok: boolean; reason?: string }> {
        if (!chrome.downloads?.onChanged) return Promise.resolve({ ok: true });

        return new Promise((resolve) => {
            const finish = (result: { ok: boolean; reason?: string }) => {
                clearTimeout(timer);
                chrome.downloads.onChanged.removeListener(onChanged);
                resolve(result);
            };

            const onChanged = (delta: chrome.downloads.DownloadDelta) => {
                if (delta.id !== id) return;
                if (delta.error?.current) {
                    finish({ ok: false, reason: delta.error.current });
                } else if (delta.state?.current === "complete") {
                    finish({ ok: true });
                }
            };

            const timer = setTimeout(
                () => finish({ ok: false, reason: "no completion signal" }),
                DOWNLOAD_TERMINAL_TIMEOUT_MS,
            );

            chrome.downloads.onChanged.addListener(onChanged);

            // Catch downloads that finished before the listener attached.
            chrome.downloads.search({ id }).then((items) => {
                const item = items?.[0];
                if (item?.state === "complete") finish({ ok: true });
                else if (item?.state === "interrupted") {
                    finish({ ok: false, reason: item.error ?? "interrupted" });
                }
            });
        });
    }
}
