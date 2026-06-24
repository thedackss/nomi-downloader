# Nomi Downloader

A browser extension (Chrome & Firefox, Manifest V3) for exporting your content from
[nomi.ai](https://beta.nomi.ai). Built with React + TypeScript + Vite, using
[`@crxjs/vite-plugin`](https://crxjs.dev/) for extension bundling and HMR.

## Features

Open the popup on a `beta.nomi.ai` tab, pick a Nomi or group, and export:

- **Album** — all of a Nomi's media, packed into one or more `.zip` files (split by size for
  large albums).
- **Chat** — the full conversation as a standalone `.html` file (optionally with selfies
  inlined).
- **Mind map** — the Nomi's memory graph and terms as an `.html` file.
- **JSON** — the raw Nomi data as a `.json` file.

> The extension uses your **existing browser session** with nomi.ai (via `host_permissions`);
> there is no separate login. You must be signed in to nomi.ai in the same browser.

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

## Architecture

```
src/
├── popup/            React UI shown in the toolbar popup
│   ├── components/   List, Info, Settings, Header, LoadingSpin
│   ├── context/      nomis + settings React contexts
│   └── hooks/        useNomi, useSettings, useTab
├── background/       MV3 service worker
│   ├── index.ts      message router; maps popup actions → download workflows
│   └── nomi/         Nomi facade + focused modules:
│       ├── api.ts            NomiApiClient (HTTP data layer)
│       ├── offscreenClient.ts  zip/blob bridge to the offscreen document
│       ├── albumDownloader.ts  album workflow
│       ├── chatDownloader.ts   chat workflow
│       ├── chunk.ts            chunkBySize() shared by both downloaders
│       └── constants.ts        chunk sizes, timeouts, pacing
├── offscreen/        Offscreen document (runs JSZip / Blob APIs MV3 can't)
├── content/          Content script injected on nomi.ai
├── interfaces/nomi/  Typed nomi.ai API responses (shared.ts holds common shapes)
└── utils/            axios instance, logging, zip, deepMerge, media URLs
```

Flow: the **popup** sends a message to the **background** worker, which drives a
**downloader** (data fetched via `NomiApiClient`, zipped/encoded via the **offscreen**
document) and reports progress back to the popup, finishing with `chrome.downloads`.

## Testing

- **`npm test`** — Vitest unit tests for the pure helpers (`getNomiMedia`, `deepMerge`,
  `chunkBySize`). No browser needed.
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
