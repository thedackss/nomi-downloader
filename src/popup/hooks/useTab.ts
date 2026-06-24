import { useCallback } from "react";
import { Log } from "../../utils/log";

type Tab = chrome.tabs.Tab;

export const useTab = () => {
    const getCurrentTab = useCallback(async () => {
        try {
            const tabs: Tab[] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (tabs.length < 1) throw new Error("No active tab found");

            const tab: Tab = tabs[0];

            const verified =
                !!tab.url && !!tab.id && !!tab.url.includes("beta.nomi.ai");

            if (!verified) throw new Error("Not a Nomi tab");

            return {
                tab,
                tabId: tab.id ?? -1,
                tabUrl: tab.url ?? "",
                ok: true,
            };
        } catch (error) {
            if (error instanceof Error) {
                Log(error.message);
            }
            return { tab: null, tabId: null, tabUrl: null, ok: false };
        }
    }, []);

    return { getCurrentTab };
};
