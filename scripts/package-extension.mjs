// Build each store target into ./release.
//
// dist/ is overwritten per target (single output folder, last build wins), so
// each target must be built before the next one runs. For each target we keep
// both an unpacked folder (release/<name>/) and a zip (release/<name>.zip) — the
// folder for loading unpacked / inspecting, the zip for store upload. Each holds
// the contents of dist/ with manifest.json at the root, which is what the stores
// expect.
//
//   npm run release        → release/{chrome,firefox}/ + release/{chrome,firefox}.zip

import { execSync } from "node:child_process";
import {
    cpSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(root, "dist");
const outDir = join(root, "release");

const version = JSON.parse(
    readFileSync(join(root, "package.json"), "utf-8"),
).version;

const targets = [
    { name: "chrome", script: "build" },
    { name: "firefox", script: "build:firefox" },
];

/** Collect every file under `dir` as paths relative to it. */
function listFiles(dir, base = dir) {
    const entries = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            entries.push(...listFiles(full, base));
        } else {
            entries.push(relative(base, full));
        }
    }
    return entries;
}

/** Zip the contents of `srcDir` (manifest.json at the root) to `zipPath`. */
async function zipDir(srcDir, zipPath) {
    const zip = new JSZip();
    const files = listFiles(srcDir);
    for (const file of files) {
        // Normalize to forward slashes so zips are valid on every platform.
        zip.file(file.split("\\").join("/"), readFileSync(join(srcDir, file)));
    }
    const buffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
    });
    writeFileSync(zipPath, buffer);
    return { count: files.length, bytes: buffer.length };
}

async function main() {
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });

    for (const target of targets) {
        console.log(`\n▶ Building ${target.name} (npm run ${target.script})…`);
        execSync(`npm run ${target.script}`, { cwd: root, stdio: "inherit" });

        if (!existsSync(join(distDir, "manifest.json"))) {
            throw new Error(
                `dist/manifest.json missing after the ${target.name} build`,
            );
        }

        // Keep an unpacked copy of this build alongside its zip.
        const folderPath = join(outDir, target.name);
        cpSync(distDir, folderPath, { recursive: true });

        const zipPath = join(outDir, `${target.name}.zip`);
        const { count, bytes } = await zipDir(folderPath, zipPath);
        const kb = (bytes / 1024).toFixed(1);
        console.log(
            `✓ release/${target.name}/ + release/${target.name}.zip — ${count} files, ${kb} kB`,
        );
    }

    console.log(
        `\nPackaged v${version} → release/{chrome,firefox}/ + release/{chrome,firefox}.zip`,
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
