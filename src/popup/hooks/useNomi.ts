import axios from "axios";
import { useCallback, useContext } from "react";
import { api } from "../../nomi/http";
import type {
    ApiGroupChatsResponse,
    GroupChat,
} from "../../nomi/types/api.groupChats";
import type { ApiGroupChatsIdResponse } from "../../nomi/types/api.groupChats.id";
import type { ApiNomisResponse, Nomi } from "../../nomi/types/api.nomis";
import type { ApiNomisIdResponse } from "../../nomi/types/api.nomis.id";
import { Log } from "../../utils/log";
import { NomisContext } from "../context/nomis";
import type { Nomis } from "../context/nomis/interfaces";
import { useTab } from "./useTab";

function isNomiURL(url: string): boolean {
    // Matches a /nomis/{id} segment anywhere in the path (e.g. /nomis/{id},
    // /profile/nomis/{id}, /nomis/{id}/photo-album), with any trailing suffix.
    const regex = /^https:\/\/beta\.nomi\.ai\/(?:[^/]+\/)*nomis\/\d{6,}/;
    return regex.test(url);
}

function isGroupURL(url: string): boolean {
    const regex = /^https:\/\/beta\.nomi\.ai\/group-chats\/\d{4,10}\/?$/;
    return regex.test(url);
}

export const useNomi = () => {
    const context = useContext(NomisContext);

    if (!context) {
        throw new Error("useNomi must be used within a NomiProvider");
    }

    const { Nomis, setNomis } = context;

    const { getCurrentTab } = useTab();

    const fetchNomis = useCallback(async () => {
        try {
            const { data } = await api.get<ApiNomisResponse>("/nomis");

            const list = data.nomis as Nomi[];

            setNomis((prev: Nomis) => ({
                ...prev,
                list: {
                    nomi: list,
                    group: prev.list.group,
                },
                loadError: null,
            }));

            return list;
        } catch (error) {
            Log("Error fetching Nomis:", error);

            // Tell the UI why, so it can show a "log in", "grant access" or
            // "offline" card instead of spinning forever.
            let kind: Nomis["loadError"] =
                axios.isAxiosError(error) &&
                (error.response?.status === 401 ||
                    error.response?.status === 403)
                    ? "auth"
                    : "network";
            if (kind === "network") {
                // Firefox lets users revoke the nomi.ai host permission at
                // any time; without it the fetch fails like a network error.
                try {
                    const granted = await chrome.permissions.contains({
                        origins: ["https://*.nomi.ai/*"],
                    });
                    if (!granted) kind = "permission";
                } catch {
                    // permissions API unavailable; keep "network".
                }
            }
            setNomis((prev: Nomis) => ({
                ...prev,
                list: { nomi: [], group: prev.list.group ?? [] },
                loadError: kind,
            }));

            return [];
        }
    }, [setNomis]);

    const fetchNomi = useCallback(async (nomiId: number) => {
        try {
            const { data } = await api.get<ApiNomisIdResponse>(
                `/nomis/${nomiId}`,
            );

            return data;
        } catch (error) {
            Log("Error fetching Nomi:");
            if (error instanceof Error) {
                console.log(error.message);
            }

            return null;
        }
    }, []);

    const fetchGroups = useCallback(async () => {
        try {
            const { data } =
                await api.get<ApiGroupChatsResponse>("/group-chats");

            const list = data.groupChats;

            setNomis((prev: Nomis) => ({
                ...prev,
                list: {
                    nomi: prev.list.nomi,
                    group: list,
                },
            }));

            return list;
        } catch (error) {
            Log("Error fetching Groups:", error);

            // Settle the list so the spinner can stop; fetchNomis (which runs
            // after) owns the loadError diagnosis.
            setNomis((prev: Nomis) => ({
                ...prev,
                list: { nomi: prev.list.nomi, group: [] },
            }));

            return [];
        }
    }, [setNomis]);

    const fetchGroup = useCallback(async (groupId: number) => {
        try {
            const { data } = await api.get<ApiGroupChatsIdResponse>(
                `/group-chats/${groupId}`,
            );

            return data;
        } catch (error) {
            Log("Error fetching Group:");
            if (error instanceof Error) {
                console.log(error.message);
            }

            return null;
        }
    }, []);

    const selectNomi = useCallback(
        (nomi: Nomi) => {
            setNomis((prev: Nomis) => ({
                ...prev,
                selected: {
                    nomi: nomi,
                    group: null,
                },
            }));
        },
        [setNomis],
    );

    const selectGroup = useCallback(
        (group: GroupChat) => {
            setNomis((prev: Nomis) => ({
                ...prev,
                selected: {
                    nomi: null,
                    group: group,
                },
            }));
        },
        [setNomis],
    );

    const checkSelectedNomi = useCallback(async () => {
        if (!Nomis.list.nomi || !Nomis.list.group) return;

        const { tabUrl } = await getCurrentTab();

        if (!tabUrl) return;

        if (isNomiURL(tabUrl)) {
            const nomiId = tabUrl.match(/\/nomis\/(\d+)/)?.[1];
            const nomi = Nomis.list.nomi.find(
                (n) => n.id.toString() === nomiId,
            );

            if (nomi) selectNomi(nomi);
        } else if (isGroupURL(tabUrl)) {
            // const groupId = tabUrl.split("/")[4];
        }
    }, [Nomis.list, getCurrentTab, selectNomi]);

    const clearSelection = useCallback(() => {
        setNomis((prev: Nomis) => ({
            ...prev,
            selected: {
                nomi: null,
                group: null,
            },
        }));
    }, [setNomis]);

    return {
        Nomis,
        selectNomi,
        selectGroup,
        clearSelection,
        fetchNomis,
        fetchNomi,
        fetchGroup,
        fetchGroups,
        checkSelectedNomi,
    };
};
