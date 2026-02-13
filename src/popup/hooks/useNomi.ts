import type { ApiNomisResponse, Nomi } from "../interfaces/nomi/api.nomis";
import type { Nomis } from "../context/nomis/interrfaces";
import { useCallback, useContext } from "react";
import { NomisContext } from "../context/nomis";
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

    const fetchNomis = useCallback(async () => {
        const { data } = await api.get<ApiNomisResponse>("/nomis");

        const list = data.nomis as Nomi[];

        setNomis((prev: Nomis) => ({
            list: list,
            selected: prev.selected,
        }));

        return list;
    }, []);

    const selectNomi = useCallback((nomi: Nomi) => {
        setNomis((prev: Nomis) => ({
            list: prev.list,
            selected: nomi,
        }));
    }, []);

    return { Nomis, selectNomi, fetchNomis };
};
