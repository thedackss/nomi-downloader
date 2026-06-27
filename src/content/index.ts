// Saves a file in the nomi.ai page context. The background builds the file
// (fetch + zip/render) but hands it here to trigger the actual download,
// because on Firefox for Android the background page can't start a download at
// all — it silently does nothing. Triggering it from a live tab (like the
// published version does) makes the download fire.

interface SaveFilePayload {
    base64: string;
    mime: string;
    filename: string;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action !== "SAVE_FILE") return;

    try {
        const { base64, mime, filename } = message.data as SaveFilePayload;

        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const blob = new Blob([bytes], {
            type: mime || "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        sendResponse({ ok: true });
    } catch (error) {
        sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    return true; // keep the channel open for the async response
});
