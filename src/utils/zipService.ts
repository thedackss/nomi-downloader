import JSZip from "jszip";

export class ZipService {
    private zips: Record<string, JSZip> = {};

    createZip(id: string) {
        this.zips[id] = new JSZip();
        return { success: true };
    }

    addFile(id: string, path: string, content: string) {
        const zip = this.zips[id];
        if (!zip) {
            throw new Error("Zip not found");
        }
        zip.file(path, content, { base64: true });
        return { success: true };
    }

    async generateZip(id: string) {
        const zip = this.zips[id];
        if (!zip) {
            throw new Error("Zip not found");
        }
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        return { success: true, url };
    }

    clearZip(id: string) {
        delete this.zips[id];
        return { success: true };
    }
}

export const zipService = new ZipService();
