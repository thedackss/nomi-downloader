import { createContext, type FC, useState } from "react";
import type { ReactElement } from "../../interfaces/reactElement";
import type { NomiContextType, Nomis } from "./interfaces";

const NomisContext = createContext<NomiContextType | null>(null);

const NomisProvider: FC<ReactElement> = ({ children }) => {
    const Default: Nomis = {
        selected: {
            group: null,
            nomi: null,
        },
        list: {
            nomi: null,
            group: null,
        },
        loadError: null,
    };

    const [Nomis, setNomis] = useState<Nomis>(Default);

    return (
        <NomisContext.Provider value={{ Nomis, setNomis }}>
            {children}
        </NomisContext.Provider>
    );
};

export { NomisContext, NomisProvider };
