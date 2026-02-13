import type { ComponentAttributes } from "../interfaces/reactElement";
import { SettingsProvider } from "../context/settings";
import type { FC, ReactElement } from "react";
import { NomisProvider } from "../context/nomis";

export const ContextProvider: FC<ComponentAttributes> = ({
    children,
}): ReactElement => {
    return (
        <>
            <SettingsProvider>
                <NomisProvider>{children}</NomisProvider>
            </SettingsProvider>
        </>
    );
};
