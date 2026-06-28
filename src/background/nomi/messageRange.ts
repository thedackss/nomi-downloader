/**
 * Narrow a chronological (oldest→newest) message list to the user's selection.
 *
 * An explicit range takes precedence: `rangeStart`/`rangeEnd` are 1-based and
 * inclusive (oldest = #1), with 0 meaning an open end. When neither bound is
 * set, fall back to the last-N cap (`maxMessages`; 0 = unlimited).
 */
export function applyMessageRange<T>(
    items: T[],
    rangeStart = 0,
    rangeEnd = 0,
    maxMessages = 0,
): T[] {
    if (rangeStart > 0 || rangeEnd > 0) {
        const start = rangeStart > 1 ? rangeStart - 1 : 0;
        const end = rangeEnd > 0 ? rangeEnd : items.length;
        return items.slice(start, end);
    }
    if (maxMessages > 0) return items.slice(-maxMessages);
    return items;
}
