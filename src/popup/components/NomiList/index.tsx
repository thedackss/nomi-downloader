import type { IconSettings } from "../../context/settings/interrfaces";
import { useSettings } from "../../hooks/useSettings";
import { useNomi } from "../../hooks/useNomi";
import { LoadingSpin } from "../LoadingSpin";
import styles from "./styles.module.scss";
import { useEffect } from "react";

export const NomiList = () => {
    const { Settings } = useSettings();
    const { Nomis, selectNomi } = useNomi();

    useEffect(() => {
        if (Nomis.selected?.nomi?.id) {
            const element = document.getElementById(
                `nomi-${Nomis.selected.nomi.id}`,
            );
            if (element) {
                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }
    }, [Nomis.selected]);

    return (
        <ul className={styles.nomiList}>
            <LoadingSpin visible={Nomis.list.nomi.length === 0} />
            {Nomis.list.nomi.map((nomi) => {
                const api = `https://beta.nomi.ai/api`;
                const base = `${api}/nomis/${nomi.id}`;

                function getMedia() {
                    const defaultImg = `${base}/images/${nomi.pictureImageId}.webp`;
                    const selfie = `${base}/selfies/${nomi.pictureSelfieImageId}.webp`;
                    const video = `${api}/video-requests/${nomi.videoRequestUuid}.mp4`;
                    const videoPrev = `${api}/video-requests/${nomi.videoRequestUuid}/preview.webp`;

                    return {
                        default: defaultImg,
                        selfie: nomi.pictureSelfieImageId ? selfie : undefined,
                        video: nomi.videoRequestUuid ? video : undefined,
                        videoPrev: nomi.videoRequestUuid
                            ? videoPrev
                            : undefined,
                    };
                }

                const media = getMedia();

                const img = media.videoPrev || media.selfie || media.default;

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

                const isSelected = Nomis.selected?.nomi?.id === nomi.id;

                return (
                    <li
                        id={`nomi-${nomi.id}`}
                        className={`${isSelected ? styles.selected : ""}`}
                        key={nomi.id}
                        onClick={() => selectNomi(nomi)}
                    >
                        <span
                            className={`${styles.icon} ${getIconSize()} ${getIconShape()}`}
                        >
                            {media.video && (
                                <video
                                    src={media.video}
                                    loop
                                    muted
                                    autoPlay
                                ></video>
                            )}
                            <span
                                className={styles.img}
                                style={{ backgroundImage: `url(${img})` }}
                            ></span>
                        </span>
                        <p>{nomi.name}</p>
                    </li>
                );
            })}
        </ul>
    );
};
