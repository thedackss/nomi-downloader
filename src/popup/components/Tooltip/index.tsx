import { type ReactNode, useRef, useState } from "react";
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

/** Nearest ancestor that clips vertically — the tooltip's real bounds. */
function clipParent(el: HTMLElement | null): HTMLElement | null {
    let node = el?.parentElement ?? null;
    while (node) {
        const overflowY = getComputedStyle(node).overflowY;
        if (
            overflowY === "auto" ||
            overflowY === "scroll" ||
            overflowY === "hidden"
        ) {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}

/**
 * A hover tooltip: a rounded bubble with a tail pointing at the trigger.
 *
 * The bubble lives on the (always-hoverable) wrapper rather than the trigger,
 * so it also works over a disabled control — give that control
 * `pointer-events: none` so the hover falls through to the wrapper.
 *
 * A top/bottom bubble flips to whichever side has room within the nearest
 * scroll container, so it never spills out of the popup frame.
 */
export const Tooltip = ({
    text,
    children,
    position = "top",
    block,
    className,
}: TooltipProps) => {
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const bubbleRef = useRef<HTMLSpanElement>(null);
    const [resolved, setResolved] = useState<TooltipPosition>(position);

    // Decide the side just before the bubble shows (on hover/focus), when the
    // trigger's on-screen position and the bubble's height are both known.
    function place() {
        if (position !== "top" && position !== "bottom") return;
        const el = wrapperRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const clip = clipParent(el);
        const bounds = clip
            ? clip.getBoundingClientRect()
            : { top: 0, bottom: window.innerHeight };
        // Bubble height + the ~9px gap and tail; 64 is a safe fallback before
        // the bubble has ever laid out.
        const needed = (bubbleRef.current?.offsetHeight ?? 64) + 12;
        const spaceAbove = rect.top - bounds.top;
        const spaceBelow = bounds.bottom - rect.bottom;

        if (spaceAbove < needed && spaceBelow > spaceAbove) {
            setResolved("bottom");
        } else if (spaceBelow < needed && spaceAbove > spaceBelow) {
            setResolved("top");
        } else {
            setResolved(position);
        }
    }

    const wrapper = [block ? styles.block : styles.wrapper, className]
        .filter(Boolean)
        .join(" ");

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: presentational hover wrapper — visibility is CSS :hover; these handlers only reposition the bubble, adding no interactive semantics.
        <span
            ref={wrapperRef}
            className={wrapper}
            data-position={resolved}
            onMouseEnter={place}
            onFocus={place}>
            {children}
            {text ? (
                <span ref={bubbleRef} className={styles.bubble} role="tooltip">
                    {text}
                </span>
            ) : null}
        </span>
    );
};
