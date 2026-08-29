import type { Dispatch } from "react";
import type { GroupChat } from "../../../nomi/types/api.groupChats";
import type { Nomi } from "../../../nomi/types/api.nomis";

export interface Nomis {
    selected: {
        nomi: Nomi | null;
        group: GroupChat | null;
    };
    list: {
        nomi: Nomi[] | null;
        group: GroupChat[] | null;
    };
    /**
     * Why the lists couldn't load: "auth" = not logged in to nomi.ai,
     * "network" = nomi.ai unreachable. Cleared on a successful fetch.
     * Without it a logged-out user saw only an endless loading spinner.
     */
    loadError: "auth" | "network" | null;
}

export type NomiContextType = {
    Nomis: Nomis;
    setNomis: Dispatch<React.SetStateAction<Nomis>>;
};
