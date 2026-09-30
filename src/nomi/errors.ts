export interface NomiErrorProps {
    id?: number;
    message: string;
    /** HTTP status of the failed request, when there was a response. */
    status?: number;
}

export class NomiError extends Error {
    public id: number | null;
    public status: number | null;

    constructor({ id, message, status }: NomiErrorProps) {
        super(message);
        this.name = "Nomi Error";
        this.id = id ?? null;
        this.status = status ?? null;
    }
}

/**
 * True when a failure means the nomi.ai session is gone (logged out or
 * expired), which is not an extension bug: the user needs to log in again.
 * Recognizes our own NomiError, a raw axios error, and the "(HTTP 401)"
 * suffix describeError puts on messages.
 */
export function isSessionExpired(error: unknown): boolean {
    if (error instanceof NomiError && error.status === 401) return true;
    const e = error as { response?: { status?: number }; message?: string };
    if (e?.response?.status === 401) return true;
    return typeof e?.message === "string" && e.message.includes("(HTTP 401)");
}

export const SESSION_EXPIRED_MESSAGE =
    "Your nomi.ai session has expired. Log in to nomi.ai again, then retry.";
