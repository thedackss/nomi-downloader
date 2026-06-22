import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import { version } from "./package.json";
import fs from "fs";
import path from "path";

const isFirefox = process.env.BROWSER_TARGET === "firefox";

const firefoxManifestFix = () => {
    return {
        name: "firefox-manifest-fix",
        closeBundle() {
            if (!isFirefox) return;

            const distDir = path.resolve("dist");
            const manifestPath = path.join(distDir, "manifest.json");

            if (fs.existsSync(manifestPath)) {
                const manifest = JSON.parse(
                    fs.readFileSync(manifestPath, "utf-8"),
                );

                if (manifest.background && manifest.background.service_worker) {
                    manifest.background.scripts = [
                        manifest.background.service_worker,
                    ];
                    delete manifest.background.service_worker;
                }

                fs.writeFileSync(
                    manifestPath,
                    JSON.stringify(manifest, null, 2),
                );
                console.log(
                    "Firefox manifest patched: replaced service_worker with scripts.",
                );
            }
        },
    };
};

const extensionManifest = {
    ...manifest,
    version,
} as any;

if (isFirefox) {
    extensionManifest.background = {
        scripts: [manifest.background.service_worker],
        type: "module",
    };
    extensionManifest.browser_specific_settings = {
        gecko: {
            id: "nomi-downloader@example.com",
            strict_min_version: "109.0",
        },
    };
    extensionManifest.permissions = extensionManifest.permissions.filter(
        (p: string) => p !== "offscreen",
    );
}

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
    plugins: [
        react(),
        crx({
            manifest: extensionManifest,
            browser: isFirefox ? "firefox" : "chrome",
        }),
        firefoxManifestFix(),
    ],
});
