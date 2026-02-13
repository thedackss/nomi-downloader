import type { ReactElement } from "../../interfaces/reactElement";
import type { Nomis, NomiContextType } from "./interrfaces";
import { createContext, useState, type FC } from "react";

const NomisContext = createContext<NomiContextType | null>(null);

const NomisProvider: FC<ReactElement> = ({ children }) => {
    const Default: Nomis = {
        selected: {
            group: null,
            nomi: null,
        },
        list: {
            nomi: [],
            group: [],
        },
    };

    const [Nomis, setNomis] = useState<Nomis>(Default);

    return (
        <NomisContext.Provider value={{ Nomis, setNomis }}>
            {children}
        </NomisContext.Provider>
    );
};

export { NomisContext, NomisProvider };
