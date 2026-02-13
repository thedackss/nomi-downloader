import type { ComponentAttributes } from "../interfaces/reactElement";
import { SettingsProvider } from "../context/settings";
import type { FC, ReactElement } from "react";

export const ContextProvider: FC<ComponentAttributes> = ({
    children,
}): ReactElement => {
    return (
        <>
            <SettingsProvider>{children}</SettingsProvider>
        </>
    );
};
