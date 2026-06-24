/**
 * Greedily pack items into chunks whose estimated total size stays under
 * `maxBytesPerChunk`. An item is never split; a single oversized item simply
 * gets its own chunk.
 */
export function chunkBySize<T>(
    items: T[],
    sizeOf: (item: T) => number,
    maxBytesPerChunk: number,
): T[][] {
    const chunks: T[][] = [];
    let current: T[] = [];
    let currentSize = 0;

    for (const item of items) {
        const size = sizeOf(item);

        if (currentSize + size > maxBytesPerChunk && current.length > 0) {
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
