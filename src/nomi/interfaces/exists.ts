export interface NomiExistsProps {
    nomiId: number;
}

/**
 * Chat Markdown export: a Nomi plus the same "most recent N" / explicit range
 * controls the chat HTML export uses. All ranges 0 = everything.
 */
export interface ChatMarkdownProps extends NomiExistsProps {
    /** Keep only the last N messages; 0 = all. */
    maxMessages?: number;
    /** Explicit 1-based inclusive range (oldest = #1); overrides maxMessages. */
    rangeStart?: number;
    rangeEnd?: number;
    /** BETA: export only messages newer than the last chat-Markdown run. */
    incremental?: boolean;
}
