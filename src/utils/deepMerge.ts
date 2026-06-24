type Dict = Record<string, unknown>;

function isObject(value: unknown): value is Dict {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * Recursively merge `source` onto `target`. Plain objects are merged key by
 * key; everything else (arrays, primitives) from `source` replaces `target`.
 * Used to reconcile stored settings with the current defaults.
 */
export function deepMerge<T>(target: T, source: unknown): T {
    if (!isObject(target) || !isObject(source)) {
        return source as T;
    }

    const output: Dict = { ...target };

    Object.keys(source).forEach((key) => {
        if (isObject(source[key]) && key in target) {
            output[key] = deepMerge(target[key], source[key]);
        } else {
            output[key] = source[key];
        }
    });

    return output as T;
}
