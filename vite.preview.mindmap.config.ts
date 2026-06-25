import { defineConfig } from "vite";

/*
 * Standalone dev server for live-previewing the exported mind map HTML design.
 * Intentionally does NOT load the extension (crxjs) config — it just serves
 * preview/mindmap.html with hot reload.
 *
 *   npm run preview:mindmap
 */
export default defineConfig({
    // Use the automatic JSX runtime so the preview can render the mind map
    // component without an explicit React import.
    esbuild: { jsx: "automatic" },
    server: {
        port: 5181,
        open: "/preview/mindmap.html",
    },
});
