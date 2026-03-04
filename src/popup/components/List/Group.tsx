import type { IconSettings } from "../../context/settings/interrfaces";
import { useSettings } from "../../hooks/useSettings";
import { useNomi } from "../../hooks/useNomi";
import styles from "./styles.module.scss";
import { useEffect } from "react";

export const GroupList = () => {
    const { Settings } = useSettings();
    const { Nomis, selectGroup } = useNomi();

    useEffect(() => {
        if (Nomis.selected?.group?.id) {
            const element = document.getElementById(
                `group-${Nomis.selected.group.id}`,
            );
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });

                    const { children: icon } = element;
                    const groupImg = icon[0].children[0];

                    groupImg.classList.add(styles.selected);
                }, 500);
            }
        }
    }, [Nomis.selected]);

    if (!Nomis.list.group) return null;

    return (
        <>
            {Nomis.list.group.map((group) => {
                const iconSettings: IconSettings = Settings.list;

                function getIconSize() {
                    switch (iconSettings.iconSize) {
                        case "small":
                            return styles.small;
                        case "medium":
                            return styles.medium;
                        case "large":
                            return styles.large;
                        case "xlarge":
                            return styles.xlarge;
                        default:
                            return styles.medium;
                    }
                }

                function getIconShape() {
                    switch (iconSettings.iconShape) {
                        case "circle":
                            return styles.circle;
                        case "square":
                            return styles.square;
                        case "sharp":
                            return styles.sharp;
                        default:
                            return styles.square;
                    }
                }

                const isSelected = Nomis.selected?.group?.id === group.id;

                function handleSelect() {
                    if (isSelected) return;
                    selectGroup(group);
                }

                const nomis = group.nomis.filter((nomi) => !nomi.removed);
                const images: string[] = [];

                for (let i = 0; i < nomis.length; i++) {
                    const nomi = nomis[i];

                    function getMedia() {
                        const api = `https://beta.nomi.ai/api`;
                        const base = `${api}/nomis/${nomi.id}`;

                        const defaultImg = `${base}/images/${nomi.pictureImageId}.webp`;
                        const selfie = `${base}/selfies/${nomi.pictureSelfieImageId}.webp`;
                        const video = `${api}/video-requests/${nomi.videoRequestUuid}.mp4`;
                        const videoPrev = `${api}/video-requests/${nomi.videoRequestUuid}/preview.webp`;

                        return {
                            default: defaultImg,
                            selfie: nomi.pictureSelfieImageId
                                ? selfie
                                : undefined,
                            video: nomi.videoRequestUuid ? video : undefined,
                            videoPrev: nomi.videoRequestUuid
                                ? videoPrev
                                : undefined,
                        };
                    }

                    const media = getMedia();

                    images.push(
                        media.videoPrev || media.selfie || media.default,
                    );
                }

                return (
                    <li
                        id={`group-${group.id}`}
                        className={`${isSelected ? styles.selected : ""}`}
                        key={group.id}
                        onClick={handleSelect}
                    >
                        <span
                            className={`${styles.icon} ${styles.group} ${getIconSize()} ${getIconShape()}`}
                        >
                            <span className={styles.groupImg}>
                                {images.map((img, index) => (
                                    <span
                                        key={index}
                                        className={styles.img}
                                        style={{
                                            background: `url(${img}) center top / cover no-repeat`,
                                        }}
                                    />
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
                                data-darkreader-inline-stroke=""
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
                                    clipRule="evenodd"
                                ></path>
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
