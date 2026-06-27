import type { GroupChat } from "../../../nomi/types/api.groupChats";
import { useBackground } from "../../hooks/useBackground";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";

interface GroupInfoProps {
    group: GroupChat;
}

export const GroupInfo = ({ group }: GroupInfoProps) => {
    const { downloadStatus, downloadGroupChat } = useBackground();

    const isCurrentGroup =
        downloadStatus.type === "group" && downloadStatus.id === group.id;
    const message = isCurrentGroup
        ? downloadStatus.message
        : "Another download is in progress";

    return (
        <>
            <h2>{group.name}</h2>

            <ul>
                <li>
                    <span className={styles.bold}>Type: </span>
                    <span>{group.type}</span>
                </li>
                <li>
                    <span className={styles.bold}>Created: </span>
                    <span>{new Date(group.created).toLocaleDateString()}</span>
                </li>
                <li>
                    <span className={styles.bold}>Image style: </span>
                    <span>{group.artSettings.imageStyle}</span>
                </li>
                {group.nomis.length > 0 && (
                    <li>
                        <span className={styles.bold}>Members: </span>
                        <span>{group.nomis.map((n) => n.name).join(", ")}</span>
                    </li>
                )}
            </ul>

            <div
                className={
                    styles.downloadSection +
                    `${
                        downloadStatus.inProgress ? ` ${styles.inProgress}` : ""
                    }`
                }>
                <LoadingSpin
                    className={styles.loadingSpin}
                    visible={downloadStatus.inProgress}>
                    <h3>
                        Downloading
                        <p>{message}</p>
                    </h3>
                </LoadingSpin>
                <div className={styles.splitButton}>
                    <button
                        type="button"
                        className={`${styles.splitMain} ${styles.solo}`}
                        onClick={downloadGroupChat}
                        disabled={downloadStatus.inProgress}>
                        Download Chat
                    </button>
                </div>
            </div>
        </>
    );
};
