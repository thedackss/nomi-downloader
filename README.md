# Nomi Downloader

Export and archive everything you do with your [nomi.ai](https://beta.nomi.ai)
companions — albums, chats, memories and more — straight from a browser popup.

A cross-browser extension (Chrome & Firefox, Manifest V3) built with
React + TypeScript + Vite, using [`@crxjs/vite-plugin`](https://crxjs.dev/) for
bundling and HMR.

**Get it from the stores:**

- 🦊 [Firefox Add-ons](https://addons.mozilla.org/en-GB/firefox/addon/nomi-downloader/)
- 🟦 [Chrome Web Store](https://chromewebstore.google.com/detail/dglkpknkpjcfdbbmgidognlnanlocfem)

> Uses your **existing browser session** with nomi.ai (via `host_permissions`) —
> there's no separate login. Just be signed in to nomi.ai in the same browser.

## Store description

> Nomi Downloader is a powerful **Firefox** extension designed to help you easily
> manage and save all your interactions with your favourite Nomi. Whether you want
> to keep a complete archive of your chats or download an entire album of your
> Nomi's media, Nomi Saver has you covered. With just a few clicks, you can download
> entire albums or entire chat histories, preserving your memories with your Nomi
> for offline access.

The Chrome listing is identical, with "Firefox" replaced by "Chrome".

## Features

Open the popup on a `beta.nomi.ai` tab, pick a Nomi or a group, and export. Every
export is a self-contained file (or `.zip`) that works fully offline.

### Single Nomi

- **Album** — every selfie, art image, edited photo and video, packed into one or
  more `.zip` files. Split by a configurable per-zip size (and optionally an image
  count), optionally organized into per-type folders, in HD (`.png`) or SD (`.webp`).
- **Prompt files** — optionally save the generation prompt for Art and edited
  photos alongside each image, as a sidecar `.txt`, embedded in the image metadata
  (PNG), or both.
- **Chat** — the full conversation as a standalone, styled `.html` file, with
  selfies inlined or text-only. Long chats split across multiple files by a
  configurable message count and/or file size.
- **Mind Map** — the Nomi's memory graph and terms as an interactive `.html` file
  (force-directed graph + a browsable table of entries).
- **Shared Notes** — backstory, roleplay, appearance and other shared notes,
  plus image/anchor settings, as an `.html` file.
- **Profile picture in headers** — the chat, mind map and shared notes HTML
  headers show the Nomi's avatar; for a video profile they use the video preview
  by default, or embed the playing video when "Animate header" is enabled.
- **JSON** — all of the above as structured data in one `.json` file, ideal for
  feeding to another tool or AI. An optional **raw data** toggle attaches the
  untouched API responses too.
- **Markdown** — the same structured data as a readable `.md` document.
- **Download All / one-click** — grab album + chat + shared notes in a single
  click, or (in advanced mode) pick exactly which type the button downloads.

### Group chats

- **Chat** — the group conversation as a standalone `.html` file, with each
  speaker's messages clearly labeled, selfies inlined or text-only.
- **Group info** — the group's facts (type, created date, image style, members)
  shown as a card at the top of the chat export.
- **JSON / Markdown** — the group's facts and full chat log as structured data.

### Configuration

A tabbed settings panel (Interface · Downloads · Advanced):

- **Image quality** — HD (`.png`) or SD (`.webp`).
- **Images per zip** — cap how many images each `.zip` holds (0 = auto, split by
  size only).
- **Max zip size (MB)** — per-zip size cap that drives album splitting (0 = the
  built-in safe default). Raise it to split into fewer, larger zips.
- **Organize into folders** — sort album media into per-type subfolders.
- **Concurrent downloads** — how many media items to fetch in parallel.
- **Max messages** — export only the most recent N chat messages (0 = all).
- **Messages per file** — split the chat export every N messages (0 = no count cap).
- **Max file size (MB)** — per-file size cap for chat exports (0 = the built-in
  safe default). Raise it to split into fewer, larger files.
- **Include selfies in chat** — embed images in the chat HTML, or keep it text-only.
- **Animate header** — when a Nomi's profile is a video, embed the playing video in
  the chat / mind map / shared notes HTML headers instead of a still frame.
- **Prompt files** — off / sidecar `.txt` / image metadata / both.
- **Raw data** — include the untouched API responses in JSON exports.
- **Advanced download mode** — per-type toggles that turn the download button into
  a selector, so you choose precisely which export each click produces.
- **Interface** — layout (auto/mobile/desktop), Nomi icon shape & size, a daily
  usage stats panel, and a debug logging toggle. On mobile the selected Nomi or
  group's picture is shown on its info screen (the list is hidden when one pane).

## Requirements

- Node.js 24 (a `default` nvm alias is fine)
- A Chromium browser (Chrome/Edge/Brave) and/or Firefox to load the extension into

## Setup

```bash
npm install
```

## Scripts

| Command                 | What it does                                           |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Vite dev server with HMR, Chrome target                |
| `npm run dev:firefox`   | Vite dev server with HMR, Firefox target               |
| `npm run build`         | Standalone production build → `dist/`, Chrome target   |
| `npm run build:firefox` | Standalone production build → `dist/`, Firefox target  |
| `npm run lint`          | ESLint                                                  |
| `npm test`              | Unit tests (Vitest)                                    |
| `npm run test:e2e`      | Playwright popup smoke test (builds first, headful)    |
| `npm run preview`       | Preview a production build                             |

> There is a single `dist/` folder that is overwritten per target. Build the target you
> intend to load — last build wins.

## Loading the extension

### Chrome / Edge / Brave

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and select the `dist/` folder (it must contain `manifest.json`)
4. After a rebuild or manifest change, click the **↻ reload** icon on the extension card

### Firefox

1. Run `npm run build:firefox` (the manifest needs the Firefox `background.scripts` fix)
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on…** and select `dist/manifest.json`

> Temporary add-ons are removed when Firefox restarts, so re-load each session.

### Firefox for Android

Testing on a phone uses remote debugging over USB via `web-ext`:

1. On the phone: install **Firefox** (Nightly recommended), enable **Developer
   options → USB debugging**, and in Firefox enable **Settings → Remote debugging
   via USB**.
2. On the computer: install `adb` and confirm the device shows in `adb devices`.
3. Run:

   ```bash
   npm run start:firefox-android
   ```

   This builds the Firefox target and launches it on the connected device
   (`web-ext run -t firefox-android --source-dir dist`). If you have more than one
   device, pass `--android-device <id>`; to target a specific build, append
   `--firefox-apk org.mozilla.fenix` (Nightly) / `org.mozilla.firefox` (Release).

The popup opens from the **⋮ menu → Extensions → Nomi Downloader**. The manifest
declares `gecko_android`, so the published add-on can also be installed straight
from [AMO](https://addons.mozilla.org/en-GB/firefox/addon/nomi-downloader/) on
Firefox for Android.

## Architecture

```
src/
├── nomi/             Shared, context-agnostic nomi domain (no chrome.*)
│   ├── api.ts        NomiApiClient (pure HTTP data layer)
│   ├── http.ts       axios instance
│   ├── media.ts      getNomiMedia / getNomiImageUrl (media URLs)
│   ├── errors.ts     NomiError
│   ├── interfaces/   download/get prop shapes
│   └── types/        typed nomi.ai API responses (shared.ts = common shapes)
├── popup/            React UI shown in the toolbar popup
│   ├── components/   List, Info, Settings, Header, LoadingSpin
│   ├── context/      nomis + settings React contexts
│   └── hooks/        useNomi, useSettings, useBackground, useTab
├── background/       MV3 service worker
│   ├── index.ts      message router; maps popup actions → download workflows
│   └── nomi/         chrome.*-specific orchestration:
│       ├── index.ts            Nomi facade (composes the pieces below)
│       ├── offscreenClient.ts  zip/blob/render bridge to the offscreen document
│       ├── albumDownloader.ts  album workflow (+ prompt sidecars/metadata)
│       ├── chatDownloader.ts   single-Nomi chat workflow
│       ├── groupChatDownloader.ts  group chat workflow
│       ├── metadata.ts         PNG prompt embedding + base64 helpers
│       ├── headerMedia.ts      export-header avatar/video → data URIs
│       ├── chat/ mindmap/ sharednotes/  JSX → standalone HTML documents
│       ├── json/ markdown/     structured data builders (Nomi + group)
│       ├── chunk.ts            chunkBySize() shared by the downloaders
│       └── constants.ts        chunk sizes, timeouts, pacing
├── offscreen/        Offscreen document (runs JSZip / Blob / react-dom/server)
├── content/          Content script injected on nomi.ai
└── utils/            logging, zip, deepMerge
```

Dependency direction: both `popup/` and `background/` depend on the shared
`src/nomi/` layer; nothing depends on `background/` except itself.

Flow: the **popup** sends a message to the **background** worker, which drives a
**downloader** (data fetched via `NomiApiClient`, zipped/encoded and HTML rendered via
the **offscreen** document) and reports progress back to the popup, finishing with
`chrome.downloads`.

## Testing

- **`npm test`** — Vitest unit tests for the pure helpers and builders (`getNomiMedia`,
  `deepMerge`, `chunkBySize`, the JSON/Markdown builders, prompt metadata, HTML render).
  No browser needed.
- **`npm run test:e2e`** — builds the extension, then loads it in a real (headful) Chromium
  via Playwright and asserts the popup mounts, renders, and opens settings without errors.
  Browser extensions can't load in headless Chromium, so the script wraps Playwright in
  `xvfb-run` for headless servers. First run needs the browser + system deps:

  ```bash
  npx playwright install --with-deps chromium
  ```

  The e2e covers rendering only; authenticated download flows require a signed-in nomi.ai
  session and are best verified manually in your own browser.

## Dev on a headless server (build over SSH, load on a desktop)

The project is often developed on a headless Linux server via VSCode Remote-SSH, while the
browser runs on a separate desktop. Two things to know:

- **`npm run build`** produces a self-contained `dist/` with no dev-server dependency. Copy
  or network-share `dist/` to the desktop and load it unpacked. This is the reliable path —
  it works regardless of the server.
- **`npm run dev`** is different: the loaded extension connects back to the Vite dev server
  at `localhost:5173` (see [`vite.config.ts`](vite.config.ts)) for modules and HMR. For this
  to work cross-machine, **forward port 5173** from the server to the desktop's localhost.
  With VSCode Remote-SSH this happens automatically (or add `5173` in the *Ports* panel).
  Then the desktop browser's `localhost:5173` tunnels to the server's Vite and HMR works.

If the popup is blank or the console reports errors about `localhost:5173`, the port forward
isn't active — fall back to `npm run build`.

To deliver `dist/` to the desktop, a mapped network drive (SMB) pointing at the project
folder is convenient: the browser always sees the current build, and the CRXJS entry stubs
rarely change, so HMR keeps working without re-copying.
