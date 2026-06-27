import { useCallback, useContext } from "react";
import type {
    ApiGroupChatsResponse,
    GroupChat,
} from "../../nomi/types/api.groupChats";
import type { ApiGroupChatsIdResponse } from "../../nomi/types/api.groupChats.id";
import type { ApiNomisResponse, Nomi } from "../../nomi/types/api.nomis";
import type { ApiNomisIdResponse } from "../../nomi/types/api.nomis.id";
import { Log } from "../../utils/log";
import { nomiApi } from "../api";
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
            const data = await nomiApi<ApiNomisResponse>("getNomis");

            const list = data.nomis as Nomi[];

            setNomis((prev: Nomis) => ({
                list: {
                    nomi: list,
                    group: prev.list.group,
                },
                selected: prev.selected,
            }));

            return list;
        } catch (error) {
            Log("Error fetching Nomis:");
            if (error instanceof Error) {
                console.log(error.message);
            }

            return [];
        }
    }, [setNomis]);

    const fetchNomi = useCallback(async (nomiId: number) => {
        try {
            const data = await nomiApi<ApiNomisIdResponse>("getNomi", {
                nomiId,
            });

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
            const data = await nomiApi<ApiGroupChatsResponse>("getGroups");

            const list = data.groupChats;

            setNomis((prev: Nomis) => ({
                list: {
                    nomi: prev.list.nomi,
                    group: list,
                },
                selected: prev.selected,
            }));

            return list;
        } catch (error) {
            Log("Error fetching Groups:");
            if (error instanceof Error) {
                console.log(error.message);
            }

            return [];
        }
    }, [setNomis]);

    const fetchGroup = useCallback(async (groupId: number) => {
        try {
            const data = await nomiApi<ApiGroupChatsIdResponse>("getGroup", {
                groupId,
            });

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
                list: prev.list,
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
                list: prev.list,
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
            list: prev.list,
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
