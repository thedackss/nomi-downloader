import type { IconSettings } from "../../context/settings/interfaces";
import styles from "./styles.module.scss";

/** Map the configured icon size to its CSS-module class. */
export function getIconSize(iconSize: IconSettings["iconSize"]): string {
    switch (iconSize) {
        case "small":
            return styles.small;
        case "medium":
            return styles.medium;
        case "large":
            return styles.large;
        case "xlarge":
            return styles.xlarge;
        default:
            return styles.medium;
    }
}

/** Map the configured icon shape to its CSS-module class. */
export function getIconShape(iconShape: IconSettings["iconShape"]): string {
    switch (iconShape) {
        case "circle":
            return styles.circle;
        case "square":
            return styles.square;
        case "sharp":
            return styles.sharp;
        default:
            return styles.square;
    }
}
