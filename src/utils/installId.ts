import { Log } from "./log";

const KEY = "installId";

/**
 * A random id created once per install and kept in chrome.storage.local. It
 * identifies this install to the bugs API so developer replies can route back
 * — without identifying the person. Sent only with bug reports the user
 * chooses to submit, never with the version check.
 */
export async function getInstallId(): Promise<string | undefined> {
    try {
        const stored = await chrome.storage.local.get(KEY);
        if (typeof stored[KEY] === "string") return stored[KEY];
        const id = `i_${crypto.randomUUID().replaceAll("-", "")}`;
        await chrome.storage.local.set({ [KEY]: id });
        return id;
    } catch (err) {
        Log("Failed to read/create install id", err);
        return undefined;
    }
}
