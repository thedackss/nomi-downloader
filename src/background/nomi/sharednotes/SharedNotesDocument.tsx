import { renderToStaticMarkup } from "react-dom/server";
import css from "./sharednotes.scss?inline";
import type { SharedNote, SharedNotesRenderPayload } from "./types";

/*
 * The exported Shared Notes HTML, authored as a component so the design can be
 * edited like normal React/SCSS instead of a giant template string. Renders to
 * a self-contained static document (renderSharedNotesDocument) with the
 * compiled SCSS inlined, so the downloaded file needs no runtime.
 *
 * Styles use plain (non-module) class names: the export is a whole standalone
 * document, so there is nothing to scope against — keep class names here in
 * sync with sharednotes.scss.
 *
 * Live-edit with: npm run preview:notes
 */

function formatDate(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function Note({ note }: { note: SharedNote }) {
    return (
        <details className="note" open>
            <summary className="note-head">
                <span className="heading">
                    <h2>{note.title}</h2>
                    {note.description ? <p>{note.description}</p> : null}
                </span>
                <span className="chevron">▾</span>
            </summary>
            <div className="note-body">
                <div className="content">{note.content}</div>
            </div>
        </details>
    );
}

function SharedNotesDocument(payload: SharedNotesRenderPayload) {
    const { name, avatar, generatedAt, notes } = payload;
    const generated = formatDate(generatedAt);

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>{`${name} — Shared Notes`}</title>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inlining the compiled SCSS so the export is self-contained */}
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </head>
            <body>
                <header className="notes-header">
                    {avatar ? (
                        <img className="avatar" src={avatar} alt={name} />
                    ) : null}
                    <div className="title">
                        <h1>{name} — Shared Notes</h1>
                        {generated && (
                            <span className="generated">
                                Generated {generated}
                            </span>
                        )}
                    </div>
                </header>

                <main>
                    {notes.map((note) => (
                        <Note key={note.title} note={note} />
                    ))}
                </main>
            </body>
        </html>
    );
}

/** Render the full standalone Shared Notes HTML document to a string. */
export function renderSharedNotesDocument(
    payload: SharedNotesRenderPayload,
): string {
    return `<!DOCTYPE html>${renderToStaticMarkup(<SharedNotesDocument {...payload} />)}`;
}

/**
 * Render a serializable payload (built in the worker) to the HTML string.
 * This is the entry point used by the offscreen document.
 */
export function renderSharedNotesPayload(
    payload: SharedNotesRenderPayload,
): string {
    return renderSharedNotesDocument(payload);
}
