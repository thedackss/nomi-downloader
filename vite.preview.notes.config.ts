import { defineConfig } from "vite";

/*
 * Standalone dev server for live-previewing the exported Shared Notes HTML.
 * Intentionally does NOT load the extension (crxjs) config — it just serves
 * preview/notes.html with hot reload.
 *
 *   npm run preview:notes
 */
export default defineConfig({
    // Use the automatic JSX runtime so the preview can render the component
    // without an explicit React import.
    esbuild: { jsx: "automatic" },
    server: {
        port: 5182,
        open: "/preview/notes.html",
    },
});
