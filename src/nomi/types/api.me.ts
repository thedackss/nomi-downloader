/** Subset of GET /me that the extension actually uses. */
export interface ApiMeResponse {
    id: number;
    name: string;
    email: string;
    image: string;
    /** Stable public account id; used (opt-in) to key synced stats. */
    publicId?: string;
    profile: {
        publicId?: string;
        name: string;
        nomiCount: number;
        activeNomiCount: number;
        activeGroupChatCount: number;
    };
}
