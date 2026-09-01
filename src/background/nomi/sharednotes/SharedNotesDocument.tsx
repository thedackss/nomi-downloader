import { renderToStaticMarkup } from "react-dom/server";
import { NomiProfileLink } from "../nomiLink";
import css from "./sharednotes.scss?inline";
import type { AnchorLook, SharedNote, SharedNotesRenderPayload } from "./types";

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
        <details className="note">
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

/** Inline label/value row for short anchor fields. */
function AnchorRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="row">
            <span className="label">{label}</span>
            <span className="value">{value}</span>
        </div>
    );
}

/** Label + paragraph for longer anchor text; renders nothing when empty. */
function AnchorBlock({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <div className="block">
            <span className="label">{label}</span>
            <p>{value}</p>
        </div>
    );
}

function AnchorsNote({
    title,
    anchors,
}: {
    title: string;
    anchors: AnchorLook[];
}) {
    return (
        <details className="note">
            <summary className="note-head">
                <span className="heading">
                    <h2>{title}</h2>
                    <p>{anchors.length} saved anchor look(s).</p>
                </span>
                <span className="chevron">▾</span>
            </summary>
            <div className="note-body">
                <div className="anchors">
                    {anchors.map((anchor, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: static export, anchor order never changes
                        <div className="anchor" key={i}>
                            {anchor.image ? (
                                <img
                                    className="anchor-img"
                                    src={anchor.image}
                                    alt={`Anchor ${i + 1}`}
                                />
                            ) : (
                                <div className="anchor-img placeholder">
                                    No preview
                                </div>
                            )}
                            <div className="anchor-meta">
                                {anchor.anchorType ? (
                                    <AnchorRow
                                        label="Anchor Type"
                                        value={anchor.anchorType}
                                    />
                                ) : null}
                                {anchor.style ? (
                                    <AnchorRow
                                        label="Style"
                                        value={anchor.style}
                                    />
                                ) : null}
                                <AnchorRow
                                    label="Fidelity"
                                    value={`${Math.round(anchor.fidelity * 100)}%`}
                                />
                                <AnchorBlock
                                    label="Appearance Traits"
                                    value={anchor.appearanceTraits}
                                />
                                <AnchorBlock
                                    label="Additional Appearance Traits"
                                    value={anchor.additionalTraits}
                                />
                                <AnchorBlock
                                    label="Sticky Aesthetic"
                                    value={anchor.stickyAesthetic}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </details>
    );
}

function SharedNotesDocument(payload: SharedNotesRenderPayload) {
    const {
        name,
        nomiId,
        avatar,
        avatarVideo,
        generatedAt,
        notes,
        anchors,
        imageNotes,
    } = payload;
    const generated = formatDate(generatedAt);
    const hasImageSettings = anchors.length > 0 || imageNotes.length > 0;

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>{`${name} · Shared Notes`}</title>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inlining the compiled SCSS so the export is self-contained */}
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </head>
            <body>
                <header className="notes-header">
                    {avatarVideo ? (
                        <video
                            className="avatar"
                            src={avatarVideo}
                            poster={avatar}
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    ) : avatar ? (
                        <img className="avatar" src={avatar} alt={name} />
                    ) : null}
                    <div className="title">
                        <h1>{name} · Shared Notes</h1>
                        {generated && (
                            <span className="generated">
                                Generated {generated}
                            </span>
                        )}
                        <NomiProfileLink nomiId={nomiId} />
                    </div>
                </header>

                <main>
                    {notes.length > 0 && (
                        <section>
                            <h2 className="group-title">Shared Notes</h2>
                            {notes.map((note) => (
                                <Note key={note.title} note={note} />
                            ))}
                        </section>
                    )}

                    {hasImageSettings && (
                        <section>
                            <h2 className="group-title">Image Settings</h2>
                            {anchors.length > 0 && (
                                <AnchorsNote
                                    title={`${name}'s Anchors`}
                                    anchors={anchors}
                                />
                            )}
                            {imageNotes.map((note) => (
                                <Note key={note.title} note={note} />
                            ))}
                        </section>
                    )}
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
