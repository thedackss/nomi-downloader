/** GET /me/daily-usage-counts — per-day activity counters. */
export interface ApiDailyUsageResponse {
    dailyUsageCounts: DailyUsageCounts;
}

export interface DailyUsageCounts {
    chatUserMessages: number;
    chatNomiMessages: number;
    chatUserSpeechMessages: number;
    chatNomiSpeechMessages: number;
    groupChatUserMessages: number;
    groupChatNomiMessages: number;
    groupChatUserSpeechMessages: number;
    groupChatNomiSpeechMessages: number;
    totalSelfieRequests: number;
    videoRequestUsages: number;
    date: string;
}
