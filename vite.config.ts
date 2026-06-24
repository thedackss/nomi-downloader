import fs from "node:fs";
import path from "node:path";
import { crx, type ManifestV3Export } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./manifest.json";
import { version } from "./package.json";

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

                if (manifest.background?.service_worker) {
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

type ExtensionManifest = Omit<
    typeof manifest,
    "background" | "permissions" | "browser_specific_settings"
> & {
    version: string;
    background: { service_worker?: string; scripts?: string[]; type: string };
    permissions: string[];
    browser_specific_settings?: {
        gecko: { id: string; strict_min_version: string };
    };
};

const extensionManifest: ExtensionManifest = {
    ...manifest,
    version,
};

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
    build: {
        // Stable (unhashed) output names. With the build-on-server →
        // load-on-desktop workflow, hashed names rename every build and a
        // reloaded extension 404s on the old files. Stable names overwrite
        // in place, so a reload just picks up fresh content.
        rollupOptions: {
            output: {
                entryFileNames: "assets/[name].js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: "assets/[name].[ext]",
            },
        },
    },
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
            manifest: extensionManifest as ManifestV3Export,
            browser: isFirefox ? "firefox" : "chrome",
        }),
        firefoxManifestFix(),
    ],
});
