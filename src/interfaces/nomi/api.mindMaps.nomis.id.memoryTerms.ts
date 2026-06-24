export interface ApiMindMapsTermsResponse {
    page: number;
    totalCount: number;
    totalPages: number;
    memoryTerms: MemoryTerm[];
    empty: boolean;
    highPriorityTermCountForCategory: number;
}

export interface MemoryTerm {
    uuid: string;
    category: Category;
    priority: Priority;
    title: string;
    summary: null;
    locked: boolean;
    memoryCount: number;
    created: Date;
    userEdited: null;
    aiEdited: Date;
    state: State;
    error: null;
    selected: boolean;
    candidate: boolean;
}

export enum Category {
    Entity = "Entity",
    Keyword = "Keyword",
    Goal = "Goal",
}

export enum Priority {
    High = "High",
    Standard = "Standard",
    Low = "Low",
}

export enum State {
    Default = "Default",
}

export interface MemoryTermItem {
    uuid: string;
    category: string;
    priority: string;
    title: string;
    summary: null;
    locked: boolean;
    memoryCount: number;
    created: string;
    userEdited: null;
    aiEdited: string;
    state: string;
    error: null;
    selected: boolean;
    candidate: boolean;
    dossier: string;
}
