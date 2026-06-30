import type { FC, ReactElement } from "react";
import { ErrorReportProvider } from "../context/errorReport";
import { NomisProvider } from "../context/nomis";
import { SettingsProvider } from "../context/settings";
import type { ComponentAttributes } from "../interfaces/reactElement";

export const ContextProvider: FC<ComponentAttributes> = ({
    children,
}): ReactElement => {
    return (
        <ErrorReportProvider>
            <SettingsProvider>
                <NomisProvider>{children}</NomisProvider>
            </SettingsProvider>
        </ErrorReportProvider>
    );
};
