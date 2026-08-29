import { useEffect, useState } from "react";
import { getUpdateCheck, type VersionCheck } from "../../utils/version";

/**
 * Runs the shared (memoized) version check once and returns its result.
 * `null` means unknown — offline, the endpoint failed, or still in flight —
 * so callers should treat it as "don't nag".
 */
export function useUpdateCheck(): VersionCheck | null {
    const [check, setCheck] = useState<VersionCheck | null>(null);

    useEffect(() => {
        let cancelled = false;
        getUpdateCheck().then((result) => {
            if (!cancelled) setCheck(result);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return check;
}
