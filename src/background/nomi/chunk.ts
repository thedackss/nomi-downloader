/**
 * Greedily pack items into chunks whose estimated total size stays under
 * `maxBytesPerChunk`. An item is never split; a single oversized item simply
 * gets its own chunk.
 *
 * `maxCountPerChunk` adds an optional hard cap on the number of items per
 * chunk (e.g. a user-set "images per zip"). The byte budget is always the
 * safety floor: a chunk closes as soon as *either* limit would be exceeded.
 */
export function chunkBySize<T>(
    items: T[],
    sizeOf: (item: T) => number,
    maxBytesPerChunk: number,
    maxCountPerChunk = Number.POSITIVE_INFINITY,
): T[][] {
    const chunks: T[][] = [];
    let current: T[] = [];
    let currentSize = 0;

    for (const item of items) {
        const size = sizeOf(item);

        const overBytes = currentSize + size > maxBytesPerChunk;
        const overCount = current.length >= maxCountPerChunk;

        if (current.length > 0 && (overBytes || overCount)) {
            chunks.push(current);
            current = [];
            currentSize = 0;
        }

        current.push(item);
        currentSize += size;
    }

    if (current.length > 0) chunks.push(current);
    return chunks;
}
