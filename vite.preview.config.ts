import { defineConfig } from "vite";

/*
 * Standalone dev server for live-previewing the exported chat HTML design.
 * Intentionally does NOT load the extension (crxjs) config — it just serves
 * preview/chat.html with hot reload.
 *
 *   npm run preview:chat
 */
export default defineConfig({
    // Use the automatic JSX runtime so the preview can render the chat
    // component without an explicit React import.
    esbuild: { jsx: "automatic" },
    server: {
        port: 5180,
        open: "/preview/chat.html",
    },
});
