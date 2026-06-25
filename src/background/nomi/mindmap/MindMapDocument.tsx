import { renderToStaticMarkup } from "react-dom/server";
import css from "./mindmap.scss?inline";
import type { MindMapEntry, MindMapRenderPayload } from "./types";

/*
 * The exported mind map HTML, authored as a component so the design can be
 * edited like normal React/SCSS instead of a giant template string. Renders to
 * a self-contained static document (renderMindMapDocument) with the compiled
 * SCSS inlined and a small vanilla-JS engine embedded for the interactive
 * force-directed graph + view toggles — so the downloaded file needs no runtime
 * and no network.
 *
 * Styles use plain (non-module) class names: the export is a whole standalone
 * document, so there is nothing to scope against — keep class names here in
 * sync with mindmap.scss.
 *
 * Live-edit with: npm run preview:mindmap
 */

/** Raw API category -> friendly label/colour shown in the UI. */
const CATEGORIES: Array<{ key: string; label: string; blurb: string }> = [
    {
        key: "Entity",
        label: "Lore",
        blurb: "People, places, and things from your shared experiences",
    },
    {
        key: "Keyword",
        label: "Topics",
        blurb: "Themes and subjects you've discussed together",
    },
    {
        key: "Goal",
        label: "Goals",
        blurb: "Aspirations for your relationship and the future",
    },
];

const CATEGORY_VARS: Record<string, string> = {
    Entity: "var(--lore)",
    Keyword: "var(--topic)",
    Goal: "var(--goal)",
};

// Embedded engine: builds the graph nodes from the inlined JSON, runs a small
// force-directed simulation, supports dragging, and wires the Table/Graph and
// Active/All toggles. No dependencies so the exported file stands alone.
const SCRIPT = `
(function () {
  var data = JSON.parse(document.getElementById('mindmap-data').textContent);
  var nodes = data.nodes || [], edges = data.edges || [];
  var COLORS = { Entity: '#38bdf8', Keyword: '#34d399', Goal: '#a855f7' };

  var view = document.getElementById('graphView');
  var svg = document.getElementById('edges');
  var W = 0, H = 0, raf = 0, running = false;

  function measure() { var r = view.getBoundingClientRect(); W = r.width || 800; H = r.height || 600; }
  measure();

  var sim = nodes.map(function (n, i) {
    var ang = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
    var rad = Math.min(W, H) * 0.28;
    return { n: n, x: W / 2 + Math.cos(ang) * rad, y: H / 2 + Math.sin(ang) * rad,
      vx: 0, vy: 0, r: 26 + Math.min(n.memoryCount || 0, 34), el: null, pinned: false, hidden: false };
  });
  var byUuid = {};
  sim.forEach(function (s) { byUuid[s.n.uuid] = s; });

  sim.forEach(function (s) {
    var d = document.createElement('div');
    d.className = 'node';
    d.style.color = COLORS[s.n.category] || '#94a3b8';
    var span = document.createElement('span');
    span.textContent = s.n.title;
    d.appendChild(span);
    d.title = s.n.title + ' \\u00b7 ' + (s.n.memoryCount || 0) + ' memories';
    view.appendChild(d);
    s.el = d;
    drag(s, d);
  });

  var lines = edges.map(function (e) {
    var l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    svg.appendChild(l);
    return { e: e, line: l };
  });

  function step() {
    measure();
    for (var i = 0; i < sim.length; i++) {
      var a = sim[i]; if (a.hidden) continue;
      for (var j = i + 1; j < sim.length; j++) {
        var b = sim[j]; if (b.hidden) continue;
        var dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var f = (a.r * b.r * 5) / (dist * dist);
        var overlap = (a.r + b.r + 14) - dist; if (overlap > 0) f += overlap * 0.5;
        var fx = (dx / dist) * f, fy = (dy / dist) * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    edges.forEach(function (e) {
      var a = byUuid[e.fromUuid], b = byUuid[e.toUuid];
      if (!a || !b || a.hidden || b.hidden) return;
      var dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      var target = 120 + 90 / ((e.sharedMemoryCount || 0) + 1);
      var f = (dist - target) * 0.012, fx = (dx / dist) * f, fy = (dy / dist) * f;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    });
    sim.forEach(function (s) {
      if (s.hidden || s.pinned) return;
      s.vx += (W / 2 - s.x) * 0.0016; s.vy += (H / 2 - s.y) * 0.0016;
      s.vx *= 0.86; s.vy *= 0.86; s.x += s.vx; s.y += s.vy;
      s.x = Math.max(s.r + 4, Math.min(W - s.r - 4, s.x));
      s.y = Math.max(s.r + 4, Math.min(H - s.r - 4, s.y));
    });
    paint();
    raf = requestAnimationFrame(step);
  }

  function paint() {
    sim.forEach(function (s) {
      if (s.hidden) { s.el.style.display = 'none'; return; }
      s.el.style.display = '';
      var d = s.r * 2;
      s.el.style.width = d + 'px'; s.el.style.height = d + 'px';
      s.el.style.transform = 'translate(' + (s.x - s.r) + 'px,' + (s.y - s.r) + 'px)';
    });
    lines.forEach(function (l) {
      var a = byUuid[l.e.fromUuid], b = byUuid[l.e.toUuid];
      if (!a || !b || a.hidden || b.hidden) { l.line.style.display = 'none'; return; }
      l.line.style.display = '';
      l.line.setAttribute('x1', a.x); l.line.setAttribute('y1', a.y);
      l.line.setAttribute('x2', b.x); l.line.setAttribute('y2', b.y);
      l.line.setAttribute('stroke-width', Math.min(1 + (l.e.sharedMemoryCount || 0) * 0.4, 4));
    });
  }

  function start() { if (!running) { running = true; raf = requestAnimationFrame(step); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function drag(s, el) {
    el.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      s.pinned = true; el.classList.add('dragging'); el.setPointerCapture(ev.pointerId);
      var sx = ev.clientX, sy = ev.clientY, moved = false;
      function move(e) {
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) moved = true;
        var r = view.getBoundingClientRect(); s.x = e.clientX - r.left; s.y = e.clientY - r.top; s.vx = 0; s.vy = 0;
      }
      function up() {
        s.pinned = false; el.classList.remove('dragging');
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up);
        if (!moved) openTerm(s.n.uuid);
      }
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    });
  }

  var graphView = document.getElementById('graphView');
  var tableView = document.getElementById('tableView');
  var viewToggle = document.getElementById('viewToggle');

  function setView(isGraph) {
    graphView.hidden = !isGraph; tableView.hidden = isGraph;
    viewToggle.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', (b.dataset.view === 'graph') === isGraph);
    });
    if (isGraph) { measure(); start(); } else { stop(); }
  }

  function openTerm(uuid) {
    setView(false);
    var el = tableView.querySelector('[data-uuid="' + uuid + '"]');
    if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  viewToggle.addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    setView(btn.dataset.view === 'graph');
  });

  var connected = {};
  edges.forEach(function (e) { connected[e.fromUuid] = 1; connected[e.toUuid] = 1; });
  document.getElementById('filterToggle').addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    var activeOnly = btn.dataset.filter === 'active';
    sim.forEach(function (s) { s.hidden = activeOnly && !connected[s.n.uuid]; });
    this.querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b === btn); });
    paint();
  });

  window.addEventListener('resize', measure);
  if (sim.length) start();
})();
`;

function convertMarkdownToHtml(markdown: string): string {
    if (!markdown) return "";
    return markdown
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\[M\d+\]/g, "")
        .replace(/\n/g, "<br/>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function formatDate(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function TermRow({ entry }: { entry: MindMapEntry }) {
    return (
        <details className="term" data-uuid={entry.uuid}>
            <summary className="term-head">
                <span className="name">{entry.title}</span>
                <span className="badge">{entry.memoryCount} memories</span>
                <span className="chevron">▾</span>
            </summary>
            <div className="term-body">
                {entry.relations.length > 0 && (
                    <div className="relations">
                        {entry.relations.map((rel) => (
                            <span className="rel" key={rel.title}>
                                <b>{rel.title}</b>{" "}
                                <span>({rel.sharedMemories} shared)</span>
                            </span>
                        ))}
                    </div>
                )}
                {entry.dossier && (
                    <div
                        className="dossier"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: dossier markdown is escaped in convertMarkdownToHtml before formatting
                        dangerouslySetInnerHTML={{
                            __html: convertMarkdownToHtml(entry.dossier),
                        }}
                    />
                )}
                <div className="meta">
                    <span>Priority: {entry.priority}</span>
                    {formatDate(entry.created) && (
                        <span>Created: {formatDate(entry.created)}</span>
                    )}
                    {formatDate(entry.aiEdited) && (
                        <span>Updated: {formatDate(entry.aiEdited)}</span>
                    )}
                </div>
            </div>
        </details>
    );
}

function MindMapDocument(payload: MindMapRenderPayload) {
    const { name, avatar, generatedAt, nodes, edges, entries } = payload;
    const generated = formatDate(generatedAt);

    // Inlined graph data; escape "<" so it can't break out of the script tag.
    const dataJson = JSON.stringify({ nodes, edges }).replace(/</g, "\\u003c");

    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <title>{name} — Mind map</title>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inlining the compiled SCSS so the export is self-contained */}
                <style dangerouslySetInnerHTML={{ __html: css }} />
            </head>
            <body>
                <header className="mindmap-header">
                    {avatar ? (
                        <img className="avatar" src={avatar} alt={name} />
                    ) : null}
                    <div className="title">
                        <h1>{name} — Mind map</h1>
                        {generated && (
                            <span className="generated">
                                Generated {generated}
                            </span>
                        )}
                    </div>
                    <div className="toggle" id="filterToggle">
                        <button type="button" data-filter="active">
                            Show Active
                        </button>
                        <button
                            type="button"
                            data-filter="all"
                            className="active">
                            Show All
                        </button>
                    </div>
                    <div className="toggle" id="viewToggle">
                        <button type="button" data-view="table">
                            Table
                        </button>
                        <button
                            type="button"
                            data-view="graph"
                            className="active">
                            Graph
                        </button>
                    </div>
                </header>

                <main>
                    <section className="graph-view" id="graphView">
                        <svg className="edges" id="edges" />
                        {nodes.length === 0 && (
                            <div className="empty">No graph data</div>
                        )}
                    </section>

                    <section className="table-view" id="tableView" hidden>
                        <div className="sheet">
                            <div className="legend">
                                {CATEGORIES.map((c) => (
                                    <div className="card" key={c.key}>
                                        <span
                                            className="dot"
                                            style={{
                                                background:
                                                    CATEGORY_VARS[c.key],
                                            }}
                                        />
                                        <h3>{c.label}</h3>
                                        <p>{c.blurb}</p>
                                    </div>
                                ))}
                            </div>

                            {CATEGORIES.map((c) => {
                                const group = entries.filter(
                                    (e) => e.category === c.key,
                                );
                                if (group.length === 0) return null;
                                return (
                                    <div className="group" key={c.key}>
                                        <h2>{c.label}</h2>
                                        {group.map((entry) => (
                                            <TermRow
                                                entry={entry}
                                                key={entry.uuid}
                                            />
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </main>

                <script
                    id="mindmap-data"
                    type="application/json"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: inlined graph data with "<" escaped
                    dangerouslySetInnerHTML={{ __html: dataJson }}
                />
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static graph engine, no user input */}
                <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
            </body>
        </html>
    );
}

/** Render the full standalone mind map HTML document to a string. */
export function renderMindMapDocument(payload: MindMapRenderPayload): string {
    return `<!DOCTYPE html>${renderToStaticMarkup(<MindMapDocument {...payload} />)}`;
}

/**
 * Render a serializable payload (built in the worker) to the mind map HTML
 * string. This is the entry point used by the offscreen document.
 */
export function renderMindMapPayload(payload: MindMapRenderPayload): string {
    return renderMindMapDocument(payload);
}
