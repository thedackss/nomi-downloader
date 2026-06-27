import { useEffect, useState } from "react";
import type { ApiMeResponse } from "../../../nomi/types/api.me";
import type { DailyUsageCounts } from "../../../nomi/types/api.me.dailyUsage";
import { Log } from "../../../utils/log";
import { nomiApi } from "../../api";
import { useSettings } from "../../hooks/useSettings";
import styles from "./styles.module.scss";

interface StatsData {
    name: string;
    sent: number;
    received: number;
    selfies: number;
}

function summarize(name: string, usage: DailyUsageCounts): StatsData {
    return {
        name,
        sent:
            usage.chatUserMessages +
            usage.chatUserSpeechMessages +
            usage.groupChatUserMessages +
            usage.groupChatUserSpeechMessages,
        received:
            usage.chatNomiMessages +
            usage.chatNomiSpeechMessages +
            usage.groupChatNomiMessages +
            usage.groupChatNomiSpeechMessages,
        selfies: usage.totalSelfieRequests,
    };
}

export const Stats = () => {
    const { Settings } = useSettings();
    const [data, setData] = useState<StatsData | null>(null);

    const enabled = Settings.showStats;

    useEffect(() => {
        if (!enabled) return;

        let cancelled = false;
        async function load() {
            try {
                const [me, usage] = await Promise.all([
                    nomiApi<ApiMeResponse>("getUserInfo"),
                    nomiApi<DailyUsageCounts>("getDailyUsage"),
                ]);
                if (!cancelled) setData(summarize(me.profile.name, usage));
            } catch (error) {
                Log("Failed to load stats", error);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    if (!enabled || !data) return null;

    return (
        <section className={styles.stats}>
            <p className={styles.greeting}>Hello, {data.name}! Today so far:</p>
            <ul>
                <li>
                    <span className={styles.value}>{data.sent}</span>
                    <span className={styles.label}>sent</span>
                </li>
                <li>
                    <span className={styles.value}>{data.received}</span>
                    <span className={styles.label}>received</span>
                </li>
                <li>
                    <span className={styles.value}>{data.selfies}</span>
                    <span className={styles.label}>selfies</span>
                </li>
            </ul>
        </section>
    );
};
