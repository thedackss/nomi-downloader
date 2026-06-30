import { useEffect } from "react";
import { getNomiMedia } from "../../../nomi/media";
import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { getIconShape, getIconSize } from "./iconClasses";
import styles from "./styles.module.scss";

export const GroupList = () => {
    const { Settings } = useSettings();
    const { Nomis, selectGroup } = useNomi();

    useEffect(() => {
        const groupId = Nomis.selected?.group?.id;
        if (!groupId) return;

        const element = document.getElementById(`group-${groupId}`);
        if (!element) return;

        const timer = setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 500);

        return () => clearTimeout(timer);
    }, [Nomis.selected]);

    if (!Nomis.list.group) return null;

    return (
        <>
            {Nomis.list.group.map((group) => {
                const isSelected = Nomis.selected?.group?.id === group.id;

                function handleSelect() {
                    if (isSelected) return;
                    selectGroup(group);
                }

                const members = group.nomis
                    .filter((nomi) => !nomi.removed)
                    .map((nomi) => {
                        const media = getNomiMedia(nomi);
                        return {
                            id: nomi.id,
                            img:
                                media.videoPrev ||
                                media.edit ||
                                media.selfie ||
                                media.default,
                            video: media.video,
                        };
                    });

                return (
                    <li
                        id={`group-${group.id}`}
                        className={`${isSelected ? styles.selected : ""}`}
                        key={group.id}
                        onClick={handleSelect}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                                handleSelect();
                        }}>
                        <span
                            className={`${styles.icon} ${styles.group} ${getIconSize(Settings.list.iconSize)} ${getIconShape(Settings.list.iconShape)}`}>
                            <span
                                className={`${styles.groupImg} ${isSelected ? styles.selected : ""}`}>
                                {members.map((member) => (
                                    <span
                                        key={member.id}
                                        className={styles.img}
                                        style={{
                                            background: `url(${member.img}) center top / cover no-repeat`,
                                        }}>
                                        {member.video && (
                                            <video
                                                src={member.video}
                                                loop
                                                muted
                                                autoPlay></video>
                                        )}
                                    </span>
                                ))}
                            </span>
                            <svg
                                stroke="currentColor"
                                fill="currentColor"
                                strokeWidth="0"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                height="1em"
                                width="1em"
                                xmlns="http://www.w3.org/2000/svg"
                                // style="--darkreader-inline-fill: currentColor; --darkreader-inline-stroke: currentColor;"
                                data-darkreader-inline-fill=""
                                data-darkreader-inline-stroke="">
                                <path
                                    fillRule="evenodd"
                                    d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
                                    clipRule="evenodd"></path>
                                <path d="M5.082 14.254a8.287 8.287 0 0 0-1.308 5.135 9.687 9.687 0 0 1-1.764-.44l-.115-.04a.563.563 0 0 1-.373-.487l-.01-.121a3.75 3.75 0 0 1 3.57-4.047ZM20.226 19.389a8.287 8.287 0 0 0-1.308-5.135 3.75 3.75 0 0 1 3.57 4.047l-.01.121a.563.563 0 0 1-.373.486l-.115.04c-.567.2-1.156.349-1.764.441Z"></path>
                            </svg>
                        </span>
                        <p>{group.name}</p>
                    </li>
                );
            })}
        </>
    );
};
