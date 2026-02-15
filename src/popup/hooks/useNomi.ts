import type { ApiNomisResponse, Nomi } from "../interfaces/nomi/api.nomis";
import type { Nomis } from "../context/nomis/interrfaces";
import { useCallback, useContext } from "react";
import { NomisContext } from "../context/nomis";
import { Log } from "../../utils/log";
import { useTab } from "./useTab";
import axios from "axios";

const nomiUrl = new URL("https://beta.nomi.ai/api");

const api = axios.create({
    baseURL: nomiUrl.toString(),
    timeout: 1000,
    headers: { "Content-Type": "application/json" },
});

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
    }, []);

    function isNomiURL(url: string): boolean {
        const regex =
            /^https:\/\/beta\.nomi\.ai\/nomis\/\d{6,}(\/photo-album)?\/?$/;
        return regex.test(url);
    }

    function isGroupURL(url: string): boolean {
        const regex = /^https:\/\/beta\.nomi\.ai\/group-chats\/\d{4,10}\/?$/;
        return regex.test(url);
    }

    const selectNomi = useCallback((nomi: Nomi) => {
        setNomis((prev: Nomis) => ({
            list: prev.list,
            selected: {
                nomi: nomi,
                group: prev.selected.group,
            },
        }));
    }, []);

    const checkSelectedNomi = useCallback(async () => {
        const { tabUrl } = await getCurrentTab();

        if (!tabUrl) return;

        if (isNomiURL(tabUrl)) {
            const nomiId = tabUrl.split("/")[4];
            const nomi = Nomis.list.nomi.find(
                (n) => n.id.toString() === nomiId,
            );

            if (nomi) selectNomi(nomi);
        } else if (isGroupURL(tabUrl)) {
            const groupId = tabUrl.split("/")[4];
        }
    }, [Nomis.list, getCurrentTab, selectNomi]);

    return { Nomis, selectNomi, fetchNomis, checkSelectedNomi };
};
