// The bundle's index.html hub: a self-contained page linking every section
// of the export (chat, shared notes, mind map, data) plus the album, grouped
// by kind (selfies, art, edits, videos) with generation prompts as captions,
// an in-page lightbox, and a list of voice calls. Plain string templating (no
// React) so it can run in the service worker; a small inline script powers the
// lightbox. All paths are relative to the extracted folder.

/** One album item, with the type and prompt the index needs to group/caption. */
export interface AlbumMediaItem {
    path: string;
    type: "Photo" | "Art" | "PhotoEdit" | "Video";
    prompt: string | null;
    date: string;
}

/** A voice call, summarized for the index (transcript lives in the chat). */
export interface CallItem {
    started: string;
    ended?: string;
    /** In-page anchor id of this call in the chat, for a deep link. */
    anchor?: string;
}

export interface BundleIndexInput {
    /** Nomi name shown as the page title. */
    name: string;
    /** Nomi id, for a link back to the profile on nomi.ai. */
    nomiId: number;
    /** ISO timestamp; shown in the footer in the viewer's local time. */
    generatedAt: string;
    /** Chat HTML filenames in order, or [] when no chat was exported. */
    chatParts: string[];
    /** Total messages in the chat, for the card meta. */
    messageCount: number;
    /** Shared-notes filename, or undefined when not exported. */
    sharedNotesFile?: string;
    /** Mind-map filename and memory-term count, or undefined when not exported. */
    mindMap?: { file: string; termCount: number };
    /** Data (JSON) filename, or undefined when not exported. */
    dataFile?: string;
    /** Album media, in save order, with type and prompt. */
    album: AlbumMediaItem[];
    /** Relative paths of voice message audio files, chronological. */
    voiceFiles: string[];
    /** Voice calls to list (linked to the chat transcript). */
    calls: CallItem[];
}

function esc(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** mm:ss (or h:mm:ss) duration between two ISO timestamps, or "" if unknown. */
function duration(started: string, ended?: string): string {
    if (!ended) return "";
    const secs = Math.max(
        0,
        Math.round(
            (new Date(ended).getTime() - new Date(started).getTime()) / 1000,
        ),
    );
    if (Number.isNaN(secs)) return "";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function shortDate(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
          });
}

/** Full date + time in the viewer's local format (the export runs on their PC). */
function localDateTime(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    --bg: #0d0e12; --surface: #181b22; --border: rgb(255 255 255 / 8%);
    --text: #e8eaf0; --muted: #888d9b; --accent: #a855f7;
    background: var(--bg); color: var(--text);
    font-family: -apple-system, blinkmacsystemfont, "Segoe UI", roboto,
        "Helvetica Neue", arial, sans-serif;
    line-height: 1.5; -webkit-font-smoothing: antialiased;
    max-width: 1100px; margin: 0 auto; padding: 48px 22px 72px;
}
h1 { font-size: 1.8rem; letter-spacing: -0.01em; }
h1 span { color: var(--accent); }
.subtitle { color: var(--muted); margin-bottom: 12px; }
.nomilink { margin-bottom: 28px; }
.nomilink a {
    display: inline-block; padding: 8px 16px; border-radius: 999px;
    background: var(--surface); border: 1px solid var(--border);
    color: var(--accent); text-decoration: none; font-size: 0.9rem; font-weight: 600;
}
.nomilink a:hover { border-color: var(--accent); }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-bottom: 40px; }
.card {
    display: block; padding: 18px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 14px;
    color: var(--text); text-decoration: none;
    transition: border-color 0.15s ease, transform 0.15s ease;
}
.card:hover { border-color: var(--accent); transform: translateY(-2px); }
.card .icon { font-size: 1.6rem; }
.card .title { font-weight: 650; margin-top: 6px; }
.card .meta { font-size: 0.85rem; color: var(--muted); }
h2 { font-size: 1.2rem; margin: 30px 0 14px; }
h2 .count { color: var(--muted); font-weight: 400; font-size: 0.95rem; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.thumb {
    display: block; padding: 0; border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; background: var(--surface);
    cursor: pointer; text-align: left; color: var(--text); font: inherit;
}
.thumb:hover { border-color: var(--accent); }
.thumb .media { aspect-ratio: 1; width: 100%; }
.thumb img, .thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
.thumb .cap {
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; padding: 7px 9px; font-size: 0.72rem; font-style: italic;
    color: var(--muted); line-height: 1.35;
}
.thumb .badge {
    position: absolute; margin: 6px; padding: 1px 7px; border-radius: 999px;
    font-size: 0.65rem; background: rgb(0 0 0 / 55%); color: #fff;
}
.thumb .wrap { position: relative; }
.voice { list-style: none; display: flex; flex-flow: column; gap: 10px; }
.voice li { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
.voice .label { font-size: 0.85rem; color: var(--muted); min-width: 130px; }
.voice audio { flex: 1; height: 36px; }
.calls { list-style: none; display: flex; flex-flow: column; gap: 8px; }
.calls a {
    display: flex; align-items: center; gap: 10px; padding: 11px 14px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; color: var(--text); text-decoration: none;
}
.calls a:hover { border-color: var(--accent); }
.calls .dur { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; }
footer { margin-top: 48px; font-size: 0.8rem; color: var(--muted); }
#lb {
    position: fixed; inset: 0; display: none; z-index: 50;
    background: rgb(0 0 0 / 82%); padding: 24px;
    flex-direction: column; align-items: center; justify-content: center; gap: 14px;
}
#lb.open { display: flex; }
#lb .stage { max-width: 92vw; max-height: 78vh; }
#lb img, #lb video { max-width: 92vw; max-height: 78vh; border-radius: 10px; display: block; }
#lb .lbcap { max-width: 780px; color: #e8eaf0; font-size: 0.9rem; font-style: italic; text-align: center; }
#lb .lbcount { color: var(--muted); font-size: 0.8rem; }
#lb .close { position: fixed; top: 18px; right: 22px; font-size: 2rem; color: #fff; cursor: pointer; line-height: 1; background: none; border: none; }
#lb .nav {
    position: fixed; top: 50%; transform: translateY(-50%);
    font-size: 3rem; color: #fff; cursor: pointer; background: none;
    border: none; padding: 0 18px; line-height: 1; user-select: none;
}
#lb .nav.prev { left: 6px; }
#lb .nav.next { right: 6px; }
#lb .nav:hover, #lb .close:hover { color: var(--accent); }
`;

const LIGHTBOX_JS = `
(function () {
    var lb = document.getElementById("lb");
    var stage = lb.querySelector(".stage");
    var cap = lb.querySelector(".lbcap");
    var count = lb.querySelector(".lbcount");
    var thumbs = Array.prototype.slice.call(document.querySelectorAll(".thumb"));
    var idx = -1;
    function render(i) {
        var el = thumbs[i];
        if (!el) return;
        idx = i;
        var src = el.getAttribute("data-full");
        var isVideo = el.getAttribute("data-video") === "1";
        var prompt = el.getAttribute("data-prompt") || "";
        stage.innerHTML = "";
        var media;
        if (isVideo) {
            media = document.createElement("video");
            media.src = src; media.controls = true; media.autoplay = true;
        } else {
            media = document.createElement("img");
            media.src = src; media.alt = prompt || "";
        }
        stage.appendChild(media);
        cap.textContent = prompt;
        count.textContent = (i + 1) + " / " + thumbs.length;
        lb.classList.add("open");
    }
    function step(d) {
        if (thumbs.length) render((idx + d + thumbs.length) % thumbs.length);
    }
    function close() { lb.classList.remove("open"); stage.innerHTML = ""; }
    thumbs.forEach(function (t, i) {
        t.addEventListener("click", function () { render(i); });
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    lb.querySelector(".close").addEventListener("click", close);
    lb.querySelector(".prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector(".next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    document.addEventListener("keydown", function (e) {
        if (!lb.classList.contains("open")) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") step(-1);
        else if (e.key === "ArrowRight") step(1);
    });
})();
`;

function card(href: string, icon: string, title: string, meta: string): string {
    return `<a class="card" href="${esc(href)}"><div class="icon">${icon}</div><div class="title">${esc(title)}</div><div class="meta">${esc(meta)}</div></a>`;
}

/** A clickable thumbnail (image or video) that opens in the lightbox. */
function thumb(item: AlbumMediaItem): string {
    const isVideo = item.type === "Video";
    const prompt = item.prompt?.trim() ?? "";
    const media = isVideo
        ? `<video src="${esc(item.path)}" preload="metadata" muted></video>`
        : `<img src="${esc(item.path)}" loading="lazy" alt="${esc(prompt)}">`;
    const badge = isVideo ? `<span class="badge">▶ video</span>` : "";
    const cap = prompt ? `<div class="cap">${esc(prompt)}</div>` : "";
    return `<button type="button" class="thumb" data-full="${esc(item.path)}"${
        isVideo ? ' data-video="1"' : ""
    } data-prompt="${esc(prompt)}"><div class="wrap">${badge}<div class="media">${media}</div></div>${cap}</button>`;
}

/** One album section (a titled grid), or "" when the group is empty. */
function albumSection(title: string, items: AlbumMediaItem[]): string {
    if (items.length === 0) return "";
    const grid = items.map(thumb).join("\n");
    return `<h2>${esc(title)} <span class="count">${items.length}</span></h2>
<div class="gallery">
${grid}
</div>`;
}

export function buildBundleIndexHtml(input: BundleIndexInput): string {
    const cards: string[] = [];

    if (input.chatParts.length > 0) {
        const msgs = `${input.messageCount.toLocaleString()} messages`;
        cards.push(
            card(
                input.chatParts[0],
                "💬",
                "Chat",
                input.chatParts.length > 1
                    ? `${msgs} · ${input.chatParts.length} parts`
                    : msgs,
            ),
        );
        for (let i = 1; i < input.chatParts.length; i++) {
            cards.push(
                card(input.chatParts[i], "💬", `Chat · part ${i + 1}`, ""),
            );
        }
    }
    if (input.sharedNotesFile) {
        cards.push(
            card(
                input.sharedNotesFile,
                "📝",
                "Shared Notes",
                "Backstory, roleplay & more",
            ),
        );
    }
    if (input.mindMap) {
        cards.push(
            card(
                input.mindMap.file,
                "🧠",
                "Mind Map",
                `${input.mindMap.termCount.toLocaleString()} memory terms`,
            ),
        );
    }
    if (input.dataFile) {
        cards.push(
            card(input.dataFile, "🗂️", "Data (JSON)", "Structured export"),
        );
    }

    const byType = (t: AlbumMediaItem["type"]) =>
        input.album.filter((m) => m.type === t);
    const albumSections = [
        albumSection("Selfies", byType("Photo")),
        albumSection("Art", byType("Art")),
        albumSection("Edits", byType("PhotoEdit")),
        albumSection("Videos", byType("Video")),
    ]
        .filter(Boolean)
        .join("\n");

    const voiceItems = input.voiceFiles
        .map((p) => {
            const base = p.split("/").pop() ?? p;
            return `<li><span class="label">${esc(base)}</span><audio controls preload="none" src="${esc(p)}"></audio></li>`;
        })
        .join("\n");
    const voiceSection =
        input.voiceFiles.length > 0
            ? `<h2>Voice messages <span class="count">${input.voiceFiles.length}</span></h2>
<ul class="voice">
${voiceItems}
</ul>`
            : "";

    const chatHref = input.chatParts[0] ?? "";
    const callItems = input.calls
        .map((c) => {
            const dur = duration(c.started, c.ended);
            // Deep-link to the call's anchor in the chat page, so it jumps
            // there instead of opening the chat at the top.
            const target =
                chatHref && c.anchor ? `${chatHref}#${c.anchor}` : chatHref;
            const href = target ? ` href="${esc(target)}"` : "";
            return `<li><a${href}>📞 <span>${esc(shortDate(c.started))}</span>${
                dur ? `<span class="dur">${esc(dur)}</span>` : ""
            }</a></li>`;
        })
        .join("\n");
    const callsSection =
        input.calls.length > 0
            ? `<h2>Voice calls <span class="count">${input.calls.length}</span></h2>
<p class="subtitle">Transcripts are in the chat page.</p>
<ul class="calls">
${callItems}
</ul>`
            : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(input.name)} · Nomi export</title>
<style>${CSS}</style>
</head>
<body>
<h1><span>${esc(input.name)}</span> · Nomi export</h1>
<p class="subtitle">Everything in this archive, in one place. Extract all parts into the same folder for links to work.</p>
${nomiLinkHtml(input.name, input.nomiId)}
<div class="cards">
${cards.join("\n")}
</div>
${albumSections}
${voiceSection}
${callsSection}
<footer>Generated by Nomi Downloader · ${esc(localDateTime(input.generatedAt))}</footer>
${LIGHTBOX_MARKUP}
<script>${LIGHTBOX_JS}</script>
</body>
</html>`;
}

/** The `<a>` linking back to the Nomi's profile on nomi.ai. */
function nomiLinkHtml(name: string, nomiId: number): string {
    return `<p class="nomilink"><a href="https://beta.nomi.ai/nomis/${encodeURIComponent(
        String(nomiId),
    )}" target="_blank" rel="noopener">Open ${esc(name)} on Nomi.ai ↗</a></p>`;
}

const LIGHTBOX_MARKUP = `<div id="lb"><button type="button" class="close" aria-label="Close">✕</button><button type="button" class="nav prev" aria-label="Previous">‹</button><button type="button" class="nav next" aria-label="Next">›</button><div class="stage"></div><div class="lbcap"></div><div class="lbcount"></div></div>`;

/**
 * A standalone album gallery page, added to a separate (non-bundle) album zip.
 * Same grouped grid + lightbox as the bundle index, without the doc cards.
 */
export function buildAlbumGalleryHtml(input: {
    name: string;
    nomiId: number;
    generatedAt: string;
    album: AlbumMediaItem[];
}): string {
    const byType = (t: AlbumMediaItem["type"]) =>
        input.album.filter((m) => m.type === t);
    const sections = [
        albumSection("Selfies", byType("Photo")),
        albumSection("Art", byType("Art")),
        albumSection("Edits", byType("PhotoEdit")),
        albumSection("Videos", byType("Video")),
    ]
        .filter(Boolean)
        .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(input.name)} · Album</title>
<style>${CSS}</style>
</head>
<body>
<h1><span>${esc(input.name)}</span> · Album</h1>
<p class="subtitle">${input.album.length.toLocaleString()} items in this folder. Click any image to preview it.</p>
${nomiLinkHtml(input.name, input.nomiId)}
${sections}
<footer>Generated by Nomi Downloader · ${esc(localDateTime(input.generatedAt))}</footer>
${LIGHTBOX_MARKUP}
<script>${LIGHTBOX_JS}</script>
</body>
</html>`;
}
