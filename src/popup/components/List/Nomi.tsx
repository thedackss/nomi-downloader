import { useEffect } from "react";
import { getNomiMedia } from "../../../nomi/media";
import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { getIconShape, getIconSize } from "./iconClasses";
import styles from "./styles.module.scss";

export const NomiList = () => {
    const { Settings } = useSettings();
    const { Nomis, selectNomi } = useNomi();

    useEffect(() => {
        const nomiId = Nomis.selected?.nomi?.id;
        if (!nomiId) return;

        const element = document.getElementById(`nomi-${nomiId}`);
        if (!element) return;

        const timer = setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 500);

        return () => clearTimeout(timer);
    }, [Nomis.selected]);

    if (!Nomis.list.nomi) return null;

    return (
        <>
            {Nomis.list.nomi.map((nomi) => {
                const media = getNomiMedia(nomi);
                const img =
                    media.videoPrev ||
                    media.edit ||
                    media.selfie ||
                    media.default;

                const isSelected = Nomis.selected?.nomi?.id === nomi.id;

                function handleSelect() {
                    if (isSelected) return;
                    selectNomi(nomi);
                }

                return (
                    <li
                        id={`nomi-${nomi.id}`}
                        className={`${isSelected ? styles.selected : ""}`}
                        key={nomi.id}
                        onClick={handleSelect}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                                handleSelect();
                        }}>
                        <span
                            className={`${styles.icon} ${getIconSize(Settings.list.iconSize)} ${getIconShape(Settings.list.iconShape)}`}>
                            {media.video && (
                                <video
                                    src={media.video}
                                    loop
                                    muted
                                    autoPlay></video>
                            )}
                            <span
                                className={styles.img}
                                style={{ backgroundImage: `url(${img})` }}
                            />
                        </span>
                        <p>{nomi.name}</p>
                    </li>
                );
            })}
        </>
    );
};
