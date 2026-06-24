import type { FC, ReactElement } from "react";
import { NomisProvider } from "../context/nomis";
import { SettingsProvider } from "../context/settings";
import type { ComponentAttributes } from "../interfaces/reactElement";

export const ContextProvider: FC<ComponentAttributes> = ({
    children,
}): ReactElement => {
    return (
        <SettingsProvider>
            <NomisProvider>{children}</NomisProvider>
        </SettingsProvider>
    );
};
