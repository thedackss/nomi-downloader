interface MindNode {
    uuid: string;
    title: string;
    category: string;
    priority: string;
    memoryCount: number;
    state: string;
    error: null | string;
}

interface MindEdge {
    fromUuid: string;
    toUuid: string;
    sharedMemoryCount: number;
}

interface MindTerm {
    uuid: string;
    title: string;
    category: string;
    priority: string;
    memoryCount: number;
    created: string;
    aiEdited: string | null;
    dossier: string | null;
}

interface MindMapData {
    graph: {
        nodes: MindNode[];
        edges: MindEdge[];
    };
    terms: Array<{
        category: string;
        items: MindTerm[];
    }>;
}

function convertMarkdownToHtml(markdown: string): string {
    if (!markdown) return "";

    return (
        markdown
            // Bold
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            // Links with reference notation [M1]
            .replace(/\[M\d+\]/g, "")
            // Line breaks
            .replace(/\n/g, "<br/>")
            // Italic
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
    );
}

export function generateMindMapHtml(data: MindMapData): string {
    if (!data || !data.terms) {
        return "<html><body><p>No data available</p></body></html>";
    }

    // Build entity lookup
    const entityMap = new Map<string, MindTerm>();
    const entities =
        data.terms.find((t) => t.category === "Entity")?.items || [];

    entities.forEach((entity) => {
        entityMap.set(entity.uuid, entity);
    });

    // Build relationship map
    const relationships = new Map<string, number>();
    (data.graph?.edges || []).forEach((edge) => {
        relationships.set(
            `${edge.fromUuid}-${edge.toUuid}`,
            edge.sharedMemoryCount,
        );
        relationships.set(
            `${edge.toUuid}-${edge.fromUuid}`,
            edge.sharedMemoryCount,
        );
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mind Map</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .entities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 50px;
        }
        
        .entity-card {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 25px;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .entity-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .entity-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
            gap: 15px;
        }
        
        .entity-header h2 {
            color: #667eea;
            font-size: 1.5em;
            flex: 1;
        }
        
        .entity-meta {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 12px;
            background: #e9ecef;
            border-radius: 20px;
            font-size: 0.85em;
            color: #495057;
            font-weight: 500;
        }
        
        .badge.memory {
            background: #cfe2ff;
            color: #084298;
        }
        
        .badge.priority {
            background: #fff3cd;
            color: #664d03;
        }
        
        .relationships {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        
        .relationships h4 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 0.95em;
        }
        
        .relationship-item {
            padding: 8px 0;
            font-size: 0.9em;
            color: #495057;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .relationship-item:last-child {
            border-bottom: none;
        }
        
        .relationship-entity {
            color: #667eea;
            font-weight: 600;
        }
        
        .shared-memories {
            color: #6c757d;
            font-size: 0.85em;
            margin-left: 5px;
        }
        
        .dossier {
            margin-top: 20px;
            padding: 15px;
            background: #f0f6ff;
            border-radius: 6px;
            border-left: 3px solid #667eea;
            font-size: 0.95em;
            line-height: 1.7;
        }
        
        .dossier strong {
            color: #667eea;
        }
        
        .dossier br {
            display: block;
            content: "";
            margin: 8px 0;
        }
        
        .timestamp {
            font-size: 0.85em;
            color: #6c757d;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #dee2e6;
        }
        
        @media (max-width: 768px) {
            header h1 {
                font-size: 1.8em;
            }
            
            .content {
                padding: 20px;
            }
            
            .entities-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .entity-card {
                page-break-inside: avoid;
                box-shadow: none;
                border: 1px solid #dee2e6;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Mind Map</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </header>
        
        <div class="content">
            <div class="entities-grid">
                ${entities
                    .map((entity) => {
                        const connectedEntities = (data.graph?.edges || [])
                            .filter(
                                (e) =>
                                    e.fromUuid === entity.uuid ||
                                    e.toUuid === entity.uuid,
                            )
                            .map((e) => {
                                const targetUuid =
                                    e.fromUuid === entity.uuid
                                        ? e.toUuid
                                        : e.fromUuid;
                                const targetEntity = entityMap.get(targetUuid);
                                return {
                                    title: targetEntity?.title || "Unknown",
                                    sharedMemories: e.sharedMemoryCount,
                                };
                            });

                        return `
                <div class="entity-card">
                    <div class="entity-header">
                        <h2>${entity.title}</h2>
                    </div>
                    
                    <div class="entity-meta">
                        <span class="badge priority">${entity.priority}</span>
                        <span class="badge memory">${entity.memoryCount} memories</span>
                    </div>
                    
                    ${
                        connectedEntities.length > 0
                            ? `
                        <div class="relationships">
                            <h4>Related to:</h4>
                            ${connectedEntities
                                .map(
                                    (rel) => `
                                <div class="relationship-item">
                                    <span class="relationship-entity">${rel.title}</span>
                                    <span class="shared-memories">(${rel.sharedMemories} shared)</span>
                                </div>
                            `,
                                )
                                .join("")}
                        </div>
                    `
                            : ""
                    }
                    
                    ${
                        entity.dossier
                            ? `
                        <div class="dossier">
                            ${convertMarkdownToHtml(entity.dossier)}
                        </div>
                    `
                            : ""
                    }
                    
                    <div class="timestamp">
                        Created: ${new Date(entity.created).toLocaleDateString()}<br/>
                        ${entity.aiEdited ? `Last updated: ${new Date(entity.aiEdited).toLocaleDateString()}` : ""}
                    </div>
                </div>
                        `;
                    })
                    .join("")}
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return html;
}

export function downloadMindMapHtml(
    data: MindMapData,
    filename: string = "mind-map.html",
): void {
    const htmlContent = generateMindMapHtml(data);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
