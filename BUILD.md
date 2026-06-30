# Build Instructions (for AMO review)

These steps reproduce an exact copy of the submitted Firefox add-on from this
source package. The extension is written in TypeScript and bundled/minified with
Vite (Rollup + esbuild), which is why the source is provided.

## Build environment requirements

- **Operating system:** any OS that runs Node.js (built and tested on Linux;
  macOS and Windows work the same way).
- **Node.js:** version **24.x** (built with **24.17.0**).
  - Install from <https://nodejs.org/> (download 24.x), or with nvm:
    ```
    nvm install 24
    nvm use 24
    ```
- **npm:** ships with Node.js (built with **11.13.0**) — no separate install.
- No other system tools are required; the build is pure Node/npm.

## Step-by-step build

1. Extract this source package (or `git clone` the repository and check out the
   submitted version), then `cd` into the project root.
2. Install the exact, pinned dependencies from `package-lock.json`:
   ```
   npm ci
   ```
3. Build the Firefox extension:
   ```
   npm run build:firefox
   ```
   This runs `tsc -b && BROWSER_TARGET=firefox vite build` and writes the
   unpacked extension to `dist/`, with `manifest.json` at its root. **The
   contents of `dist/` are exactly what was submitted as the add-on.**

   Alternatively, `npm run release` runs the same build and also packages it to
   `release/firefox.zip` (identical contents), plus `release/source.zip` (this
   source package).

## Notes for the reviewer

- The build is browser-targeted via the `BROWSER_TARGET=firefox` environment
  variable (set automatically by the script above). Chrome-only APIs such as
  `chrome.offscreen` are compiled out of the Firefox bundle, which falls back to
  in-process zipping/rendering.
- Third-party libraries, all from the public npm registry with versions pinned
  in `package-lock.json`: **React**, **react-dom**, **JSZip**, **axios**.
- The only network request to a non-nomi.ai server is an opt-in, user-confirmed
  error report POSTed to `https://nomi.zar.mx/bugs`; see `src/utils/report.ts`
  and `PRIVACY.md`.
