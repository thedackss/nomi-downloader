import { Log } from "../../utils/log";
import { BUGS_ENDPOINT } from "../../utils/report";

/** POST a bug report's text to the bugs endpoint. Resolves true on 2xx. */
export async function sendReport(info: string): Promise<boolean> {
    try {
        const res = await fetch(BUGS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ info }),
        });
        if (!res.ok) {
            Log("Bug report POST failed", res.status);
            return false;
        }
        return true;
    } catch (err) {
        Log("Bug report POST threw", err);
        return false;
    }
}
