import { defineConfig } from "vite";

/*
 * Standalone dev server for live-previewing the exported chat HTML design.
 * Intentionally does NOT load the extension (crxjs) config — it just serves
 * preview/chat.html with hot reload.
 *
 *   npm run preview:chat
 */
export default defineConfig({
    server: {
        port: 5180,
        open: "/preview/chat.html",
    },
});
