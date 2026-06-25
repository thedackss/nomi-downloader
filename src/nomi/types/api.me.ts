/** Subset of GET /me that the extension actually uses. */
export interface ApiMeResponse {
    id: number;
    name: string;
    email: string;
    image: string;
    profile: {
        name: string;
        nomiCount: number;
        activeNomiCount: number;
        activeGroupChatCount: number;
    };
}
