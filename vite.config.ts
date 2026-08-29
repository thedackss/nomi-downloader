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
        gecko: {
            id: string;
            strict_min_version: string;
            data_collection_permissions?: {
                required?: string[];
                optional?: string[];
            };
        };
        gecko_android?: Record<string, never>;
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
        // Single source of truth: the gecko id / min version live in manifest.json.
        gecko: manifest.browser_specific_settings.gecko,
        // Declare Android support so web-ext / AMO accept it on Firefox mobile.
        gecko_android: {},
    };
    extensionManifest.permissions = extensionManifest.permissions.filter(
        (p: string) => p !== "offscreen",
    );
}

// https://vite.dev/config/
export default defineConfig({
    // Compile-time flag: lets the Firefox build dead-code-eliminate the
    // offscreen branch (Firefox has no chrome.offscreen API).
    define: {
        __IS_FIREFOX__: JSON.stringify(isFirefox),
    },
    build: {
        // Stable (unhashed) output names. With the build-on-server →
        // load-on-desktop workflow, hashed names rename every build and a
        // reloaded extension 404s on the old files. Stable names overwrite
        // in place, so a reload just picks up fresh content.
        rollupOptions: {
            // Register the offscreen page as an HTML input so its script is
            // compiled and bundled. Otherwise crxjs only copies it (and the raw
            // index.ts) as a web-accessible resource, and Chrome refuses to run
            // the uncompiled .ts module in a production build.
            input: {
                "src/offscreen/index": path.resolve("src/offscreen/index.html"),
                // Fallback saver tab: triggers a tab-level anchor download
                // where the downloads API can't save (Firefox on Android).
                "src/saver/index": path.resolve("src/saver/index.html"),
            },
            output: {
                entryFileNames: "assets/[name].js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: "assets/[name].[ext]",
            },
        },
    },
    server: {
        // Bind IPv4 explicitly. The default host (localhost) resolves to IPv6
        // ::1 on some systems, but Chrome maps localhost to 127.0.0.1, so the
        // extension's HMR client can't reach an IPv6-only dev server.
        host: "127.0.0.1",
        port: 5173,
        strictPort: true,
        hmr: {
            host: "127.0.0.1",
            port: 5173,
        },
        origin: "http://127.0.0.1:5173",
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
