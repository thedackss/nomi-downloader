import type { Nomi } from "../../interfaces/nomi/api.nomis";
import type { Dispatch } from "react";

export interface Nomis {
    selected: Nomi | null;
    list: Nomi[];
}

export type NomiContextType = {
    Nomis: Nomis;
    setNomis: Dispatch<React.SetStateAction<Nomis>>;
};
