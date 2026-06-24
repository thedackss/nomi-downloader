import type { HTMLAttributes, JSX } from "react";

export type ReactElement = HTMLAttributes<HTMLDivElement>;

export interface ComponentAttributes {
    className?: string;
    children?: JSX.Element | JSX.Element[] | string | string[];
}
