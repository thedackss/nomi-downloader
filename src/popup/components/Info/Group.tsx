import type { GroupChat } from "../../../interfaces/nomi/api.groupChats";
import type { DownloadStatus } from "./interfaces";
import styles from "./styles.module.scss";

interface GroupInfoProps {
    group: GroupChat;
    downloadStatus: DownloadStatus;
}

export const GroupInfo = ({
    group,
    downloadStatus: _downloadStatus,
}: GroupInfoProps) => {
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
        </>
    );
};
