import type { GroupChat } from "../../../interfaces/nomi/api.groupChats";
import type { Nomi } from "../../../interfaces/nomi/api.nomis";
import type { Dispatch } from "react";

export interface Nomis {
    selected: {
        nomi: Nomi | null;
        group: GroupChat | null;
    };
    list: {
        nomi: Nomi[] | null;
        group: GroupChat[] | null;
    };
}

export type NomiContextType = {
    Nomis: Nomis;
    setNomis: Dispatch<React.SetStateAction<Nomis>>;
};
