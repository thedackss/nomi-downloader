import type { Nomi } from "../../../interfaces/nomi/api.nomis";
import type { Dispatch } from "react";

export interface Nomis {
    selected: {
        nomi: Nomi | null;
        group: string | null;
    };
    list: {
        nomi: Nomi[];
        group: string[];
    };
}

export type NomiContextType = {
    Nomis: Nomis;
    setNomis: Dispatch<React.SetStateAction<Nomis>>;
};
