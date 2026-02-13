import type { IconSettings } from "../../context/settings/interrfaces";
import type { Nomi } from "../../hooks/interfaces/api.nomis";
import { useSettings } from "../../hooks/useSettings";
import { useNomi } from "../../hooks/useNomi";
import { LoadingSpin } from "../LoadingSpin";
import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

export const NomiList = () => {
    const [nomis, setNomis] = useState<Nomi[]>([]);
    const { Settings } = useSettings();

    const { fetchNomis } = useNomi();

    useEffect(() => {
        const loadNomis = async () => {
            const nomis = await fetchNomis();
            setNomis(nomis);
        };

        loadNomis();
    }, []);

    return (
        <ul className={styles.nomiList}>
            <LoadingSpin
                className={`${styles.loading}${nomis.length > 0 ? ` ${styles.hidden}` : ""}`}
            />
            {nomis.map((nomi) => {
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

                return (
                    <li key={nomi.id}>
                        <span
                            className={`${styles.icon} ${getIconSize()} ${getIconShape()}`}
                            style={{ backgroundImage: `url(${img})` }}
                        >
                            <video
                                src={media.video}
                                loop
                                muted
                                autoPlay
                            ></video>
                        </span>
                        <p>{nomi.name}</p>
                    </li>
                );
            })}
        </ul>
    );
};
