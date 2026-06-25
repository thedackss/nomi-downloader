export interface ApiMindMapsGraphResponse {
    nodes: Node[];
    edges: Edge[];
}

export interface Edge {
    fromUuid: string;
    toUuid: string;
    sharedMemoryCount: number;
}

export interface Node {
    uuid: string;
    title: string;
    category: Category;
    priority: Priority;
    memoryCount: number;
    state: State;
    error: null;
}

export enum Category {
    Entity = "Entity",
    Goal = "Goal",
    Keyword = "Keyword",
}

export enum Priority {
    Standard = "Standard",
}

export enum State {
    Default = "Default",
}
