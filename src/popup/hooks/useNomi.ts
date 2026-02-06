import axios from "axios";
import { useCallback } from "react";
import type { ApiNomisResponse } from "./interfaces/api.nomis";

const nomiUrl = new URL("https://beta.nomi.ai/api");

const api = axios.create({
    baseURL: nomiUrl.toString(),
    timeout: 1000,
    headers: { "Content-Type": "application/json" },
});

export const useNomi = () => {
    const fetchNomis = useCallback(async () => {
        const nomis = await api.get<ApiNomisResponse>("/nomis");

        return nomis.data.nomis;
    }, []);

    return { fetchNomis };
};
