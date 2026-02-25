import fs from "fs";
import path from "path";

export default function firefoxManifestFix() {
    return {
        name: "firefox-manifest-fix",
        closeBundle() {
            const isFirefox = process.env.BROWSER_TARGET === "firefox";
            if (!isFirefox) return;

            const distDir = path.resolve(__dirname, "dist");
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

                    // Firefox MV3 background scripts don't support "type": "module" directly in the same way as SW (?)
                    // Actually Firefox supports type: module for background scripts.
                    // But let's keep type module if it was there.
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
}
