import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

// https://vite.dev/config/
export default defineConfig({
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            port: 5173,
        },
        origin: "http://localhost:5173",
        cors: {
            origin: "*",
            methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        },
    },
    plugins: [react(), crx({ manifest })],
});
