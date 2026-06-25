import type { ReactNode } from "react";
import styles from "./styles.module.scss";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
    /** Tooltip text. When empty, the children render with no tooltip. */
    text?: string;
    children: ReactNode;
    /** Side the bubble appears on, relative to the trigger. Default: top. */
    position?: TooltipPosition;
    /** Lay the wrapper out as a full-width block instead of inline. */
    block?: boolean;
    /** Extra class on the wrapper (margins, cursor, etc.). */
    className?: string;
}

/**
 * A hover tooltip: a rounded bubble with a tail pointing at the trigger.
 *
 * The bubble lives on the (always-hoverable) wrapper rather than the trigger,
 * so it also works over a disabled control — give that control
 * `pointer-events: none` so the hover falls through to the wrapper.
 */
export const Tooltip = ({
    text,
    children,
    position = "top",
    block,
    className,
}: TooltipProps) => {
    const wrapper = [block ? styles.block : styles.wrapper, className]
        .filter(Boolean)
        .join(" ");

    return (
        <span className={wrapper} data-position={position}>
            {children}
            {text ? (
                <span className={styles.bubble} role="tooltip">
                    {text}
                </span>
            ) : null}
        </span>
    );
};
