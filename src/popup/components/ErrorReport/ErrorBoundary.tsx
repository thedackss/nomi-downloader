import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    onError: (error: unknown, source?: string) => void;
}

interface State {
    crashed: boolean;
}

/**
 * Catches render-time crashes in the popup tree. Reports them through `onError`
 * (which opens the send-report modal) and shows a minimal fallback so the popup
 * doesn't go blank-white.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { crashed: false };

    static getDerivedStateFromError(): State {
        return { crashed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        this.props.onError(
            error.stack ? error : new Error(`${error}\n${info.componentStack}`),
            "popup:render",
        );
    }

    render() {
        if (this.state.crashed) {
            return (
                <div className="crash-fallback">
                    <p>Something went wrong.</p>
                </div>
            );
        }
        return this.props.children;
    }
}
