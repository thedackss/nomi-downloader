import type { FC, ReactNode } from "react";
import { Tooltip } from "../Tooltip";
import { RiInformation2Line } from "./RiInformation2Line";
import styles from "./styles.module.scss";

/** Info icon with a hover tooltip, shown next to a row label. */
export const Info: FC<{ text: string }> = ({ text }) => (
    <Tooltip className={styles.warning} text={text}>
        <span className={styles.icon}>
            <RiInformation2Line />
        </span>
    </Tooltip>
);

/** Titled group of rows within a section (e.g. "Voice" inside Chat). */
export const Group: FC<{
    title: string;
    beta?: boolean;
    children: ReactNode;
}> = ({ title, beta, children }) => (
    <div className={styles.group}>
        <h3>
            {title}
            {beta && <span className={styles.beta}>BETA</span>}
        </h3>
        {children}
    </div>
);

interface RowProps {
    label: ReactNode;
    /** Longer explanation shown in an info tooltip next to the label. */
    tooltip?: string;
    /** Status line under the label (e.g. "All messages"). */
    hint?: ReactNode;
    htmlFor?: string;
    /** Gray the whole row out (the control should also be disabled). */
    disabled?: boolean;
    /** The control(s), right-aligned. */
    children: ReactNode;
}

/** One setting: label + hint on the left, its control on the right. */
export const Row: FC<RowProps> = ({
    label,
    tooltip,
    hint,
    htmlFor,
    disabled,
    children,
}) => (
    <div className={`${styles.row}${disabled ? ` ${styles.disabled}` : ""}`}>
        <div className={styles.rowInfo}>
            <label htmlFor={htmlFor}>
                {label}
                {tooltip && <Info text={tooltip} />}
            </label>
            {hint && <span className={styles.hint}>{hint}</span>}
        </div>
        <div className={styles.rowControl}>{children}</div>
    </div>
);

/** Styled on/off switch backed by a checkbox. */
export const Switch: FC<{
    id?: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}> = ({ id, checked, disabled, onChange }) => (
    <label className={styles.switch}>
        <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.slider}></span>
    </label>
);

/** Number input that clamps to a minimum and falls back on empty input. */
export const NumberInput: FC<{
    id?: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    /** Value used when the field is emptied or unparsable. */
    fallback?: number;
    disabled?: boolean;
    placeholder?: string;
    onChange: (value: number) => void;
}> = ({
    id,
    value,
    min = 0,
    max,
    step,
    fallback = 0,
    disabled,
    placeholder,
    onChange,
}) => (
    <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
            onChange(Math.max(min, parseInt(e.target.value, 10) || fallback))
        }
    />
);
