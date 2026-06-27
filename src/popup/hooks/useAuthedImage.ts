// nomi.ai images (avatars, selfies) are loaded by the browser straight from
// their URLs. That works in the toolbar popup, but the in-page bubble runs the
// UI in an iframe whose requests are cookie-partitioned → 401. When embedded,
// resolve each image to a data URI fetched by the background (which has the
// session cookie); in the toolbar, pass the URL through unchanged.

import { useEffect, useState } from "react";
import { nomiApi } from "../api";

/** True when running inside the in-page iframe rather than the toolbar popup. */
export const isEmbedded = window.top !== window.self;

const cache = new Map<string, string | undefined>();

async function resolveImage(url: string): Promise<string | undefined> {
    if (!isEmbedded) return url;
    if (cache.has(url)) return cache.get(url);
    try {
        const data = await nomiApi<string | undefined>("fetchImage", { url });
        cache.set(url, data);
        return data;
    } catch {
        cache.set(url, undefined);
        return undefined;
    }
}

/** Resolve a single image URL to a usable src (data URI when embedded). */
export function useAuthedImage(url?: string): string | undefined {
    const [src, setSrc] = useState<string | undefined>(() =>
        !url ? undefined : isEmbedded ? cache.get(url) : url,
    );

    useEffect(() => {
        if (!url) {
            setSrc(undefined);
            return;
        }
        let cancelled = false;
        resolveImage(url).then((resolved) => {
            if (!cancelled) setSrc(resolved);
        });
        return () => {
            cancelled = true;
        };
    }, [url]);

    return src;
}

/** Resolve a list of image URLs (drops any that fail). */
export function useAuthedImages(urls: string[]): string[] {
    const [resolved, setResolved] = useState<string[]>(() =>
        isEmbedded ? [] : urls,
    );
    const key = urls.join("|");

    // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is the stable identity of `urls` (a fresh array each render)
    useEffect(() => {
        if (!isEmbedded) {
            setResolved(urls);
            return;
        }
        let cancelled = false;
        Promise.all(urls.map(resolveImage)).then((arr) => {
            if (!cancelled) {
                setResolved(arr.filter((x): x is string => !!x));
            }
        });
        return () => {
            cancelled = true;
        };
        // `key` captures the URL list; `urls` is a fresh array each render.
    }, [key]);

    return resolved;
}
