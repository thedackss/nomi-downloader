import {
    createContext,
    type FC,
    type ReactElement,
    useCallback,
    useEffect,
    useState,
} from "react";
import { buildReportText } from "../../../utils/report";
import { ErrorReportModal } from "../../components/ErrorReport";
import { ErrorBoundary } from "../../components/ErrorReport/ErrorBoundary";
import type { ComponentAttributes } from "../../interfaces/reactElement";

export interface PendingReport {
    /** Short, human line shown as the modal subtitle. */
    message: string;
    /** The full report text that would be sent. */
    text: string;
}

interface ErrorReportContextType {
    reportError: (error: unknown, source?: string) => void;
}

export const ErrorReportContext = createContext<ErrorReportContextType>({
    reportError: () => {},
});

export const ErrorReportProvider: FC<ComponentAttributes> = ({
    children,
}): ReactElement => {
    const [pending, setPending] = useState<PendingReport | null>(null);

    const reportError = useCallback((error: unknown, source = "popup") => {
        // One prompt at a time; ignore follow-on errors until dismissed.
        setPending((current) => {
            if (current) return current;
            const message =
                error instanceof Error
                    ? error.message
                    : String(error || "Unexpected error");
            return { message, text: buildReportText(error, source) };
        });
    }, []);

    // Catch uncaught popup errors and unhandled promise rejections.
    useEffect(() => {
        const onError = (event: ErrorEvent) => {
            // Ignore failed resource loads (images/videos) — they target the
            // element, not window, and shouldn't prompt a crash report.
            if (event.target && event.target !== window) return;
            reportError(event.error ?? event.message, "popup:onerror");
        };
        const onRejection = (event: PromiseRejectionEvent) =>
            reportError(event.reason, "popup:unhandledrejection");

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);
        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, [reportError]);

    // Pick up errors the background worker forwards (it builds the text there,
    // so its own recent logs are included).
    useEffect(() => {
        const handleMessage = (message: {
            type?: string;
            report?: PendingReport;
        }) => {
            if (message?.type === "ERROR_REPORT" && message.report) {
                setPending((current) => current ?? message.report ?? null);
            }
        };
        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    return (
        <ErrorReportContext.Provider value={{ reportError }}>
            <ErrorBoundary onError={reportError}>{children}</ErrorBoundary>
            {pending && (
                <ErrorReportModal
                    report={pending}
                    onClose={() => setPending(null)}
                />
            )}
        </ErrorReportContext.Provider>
    );
};
