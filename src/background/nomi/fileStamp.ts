/**
 * A filename-safe local timestamp, unique to the second, e.g.
 * `2026-09-01_14-30-05`. Including the time (not just the date) means a
 * second download on the same day gets a distinct name, so the browser no
 * longer appends " (1)", " (2)" to same-day re-downloads.
 */
export function fileStamp(date = new Date()): string {
    const p = (n: number) => String(n).padStart(2, "0");
    return (
        `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
        `_${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`
    );
}
