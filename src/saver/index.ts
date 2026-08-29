// Fallback saver tab. Opened by the background when the downloads API can't
// save a file (notably Firefox on Android, where downloads.download() hangs
// for extension blob URLs). A tab-level anchor click is the same machinery
// normal websites download with, so it works everywhere, keeps the real
// filename, and the button gives a guaranteed user gesture if the automatic
// click is ignored.
import "./saver.scss";

const params = new URLSearchParams(location.hash.slice(1));
const url = params.get("url") ?? "";
const name = params.get("name") ?? "download";

const button = document.getElementById("save");
const label = document.getElementById("filename");

if (label) label.textContent = name;

// Only ever hand the anchor a same-origin blob/data URL from our own
// background; anything else (a hand-edited hash) stays inert.
const usable =
    url.startsWith(`blob:${location.origin}/`) || url.startsWith("data:");

function save() {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
}

if (usable) {
    button?.addEventListener("click", save);
    // Try to save immediately; the visible button remains as the fallback.
    save();
} else {
    button?.remove();
    if (label) label.textContent = "Nothing to save (the link expired).";
}
