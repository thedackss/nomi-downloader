// A small "Open on Nomi.ai" pill link for the export headers. Uses inline
// styles so it needs no per-document SCSS (each export inlines its own CSS).

const STYLE = {
    display: "inline-block",
    marginTop: "10px",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "rgb(255 255 255 / 8%)",
    border: "1px solid rgb(255 255 255 / 12%)",
    color: "#a855f7",
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: 600,
} as const;

/** Links back to the Nomi's profile on nomi.ai; nothing when the id is absent. */
export function NomiProfileLink({ nomiId }: { nomiId?: number }) {
    if (!nomiId) return null;
    return (
        <a
            href={`https://beta.nomi.ai/nomis/${nomiId}`}
            target="_blank"
            rel="noopener"
            style={STYLE}>
            Open on Nomi.ai ↗
        </a>
    );
}
