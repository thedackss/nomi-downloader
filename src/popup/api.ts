// Read-only nomi.ai data for the popup, fetched via the background worker
// rather than directly. The popup renders both in the toolbar and in an
// in-page iframe (the mobile bubble); the iframe's direct requests are
// cookie-partitioned and 401, but the background always has the session cookie.

type ApiArgs = { nomiId?: number; groupId?: number };

interface ApiResponse<T> {
    ok: boolean;
    result?: T;
    error?: string;
}

export async function nomiApi<T>(method: string, args?: ApiArgs): Promise<T> {
    const res: ApiResponse<T> = await chrome.runtime.sendMessage({
        type: "NOMI_API",
        data: { method, args },
    });
    if (!res?.ok) throw new Error(res?.error ?? "API request failed");
    return res.result as T;
}
