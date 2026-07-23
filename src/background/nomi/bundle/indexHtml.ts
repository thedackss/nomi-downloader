// The bundle's index.html hub: a self-contained page linking every section
// of the export (chat, shared notes, mind map, data) plus an album gallery
// of relative-path thumbnails. Plain string templating (no React) so it can
// run in the service worker. All paths are relative to the extracted folder.

export interface BundleIndexInput {
    /** Nomi name shown as the page title. */
    name: string;
    /** ISO timestamp shown in the footer. */
    generatedAt: string;
    /** Chat HTML filenames in order (chat.html, chat_part2.html, …). */
    chatParts: string[];
    hasSharedNotes: boolean;
    hasMindMap: boolean;
    hasJson: boolean;
    /** Relative paths of album images to show in the gallery grid. */
    galleryImages: string[];
    /** Relative paths of album videos, listed below the gallery. */
    videos: string[];
}

function esc(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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
.subtitle { color: var(--muted); margin-bottom: 28px; }
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
h2 { font-size: 1.2rem; margin: 28px 0 14px; }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.gallery a { display: block; aspect-ratio: 1; overflow: hidden; border-radius: 10px; border: 1px solid var(--border); }
.gallery img { width: 100%; height: 100%; object-fit: cover; display: block; }
.videos { list-style: none; margin-top: 10px; }
.videos li { margin-bottom: 6px; }
.videos a { color: var(--accent); text-decoration: none; }
.videos a:hover { text-decoration: underline; }
footer { margin-top: 48px; font-size: 0.8rem; color: var(--muted); }
`;

function card(href: string, icon: string, title: string, meta: string): string {
    return `<a class="card" href="${esc(href)}"><div class="icon">${icon}</div><div class="title">${esc(title)}</div><div class="meta">${esc(meta)}</div></a>`;
}

export function buildBundleIndexHtml(input: BundleIndexInput): string {
    const cards: string[] = [];

    if (input.chatParts.length > 0) {
        cards.push(
            card(
                input.chatParts[0],
                "💬",
                "Chat",
                input.chatParts.length > 1
                    ? `${input.chatParts.length} parts`
                    : "Full conversation",
            ),
        );
        for (let i = 1; i < input.chatParts.length; i++) {
            cards.push(
                card(input.chatParts[i], "💬", `Chat — part ${i + 1}`, ""),
            );
        }
    }
    if (input.hasSharedNotes) {
        cards.push(
            card(
                "shared-notes.html",
                "📝",
                "Shared Notes",
                "Backstory, roleplay & more",
            ),
        );
    }
    if (input.hasMindMap) {
        cards.push(
            card("mind-map.html", "🧠", "Mind Map", "Memory graph & terms"),
        );
    }
    if (input.hasJson) {
        cards.push(card("data.json", "🗂️", "Data (JSON)", "Structured export"));
    }

    const gallery = input.galleryImages
        .map(
            (p) =>
                `<a href="${esc(p)}" target="_blank"><img src="${esc(p)}" loading="lazy" alt=""></a>`,
        )
        .join("\n");

    const videos = input.videos
        .map((p) => {
            const base = p.split("/").pop() ?? p;
            return `<li><a href="${esc(p)}" target="_blank">🎬 ${esc(base)}</a></li>`;
        })
        .join("\n");

    const albumSection =
        input.galleryImages.length > 0 || input.videos.length > 0
            ? `<h2>Album — ${input.galleryImages.length} images${
                  input.videos.length > 0
                      ? `, ${input.videos.length} videos`
                      : ""
              }</h2>
<div class="gallery">
${gallery}
</div>
${input.videos.length > 0 ? `<ul class="videos">\n${videos}\n</ul>` : ""}`
            : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(input.name)} — Nomi export</title>
<style>${CSS}</style>
</head>
<body>
<h1><span>${esc(input.name)}</span> — Nomi export</h1>
<p class="subtitle">Everything in this archive, in one place. Extract all parts into the same folder for links to work.</p>
<div class="cards">
${cards.join("\n")}
</div>
${albumSection}
<footer>Generated by Nomi Downloader · ${esc(input.generatedAt)}</footer>
</body>
</html>`;
}
