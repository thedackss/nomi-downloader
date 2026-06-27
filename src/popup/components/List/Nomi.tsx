import { useEffect } from "react";
import { getNomiMedia } from "../../../nomi/media";
import type { Nomi } from "../../../nomi/types/api.nomis";
import { isEmbedded, useAuthedImage } from "../../hooks/useAuthedImage";
import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { getIconShape, getIconSize } from "./iconClasses";
import styles from "./styles.module.scss";

interface NomiItemProps {
    nomi: Nomi;
    isSelected: boolean;
    onSelect: () => void;
}

const NomiItem = ({ nomi, isSelected, onSelect }: NomiItemProps) => {
    const { Settings } = useSettings();
    const media = getNomiMedia(nomi);
    const img = useAuthedImage(
        media.videoPrev || media.edit || media.selfie || media.default,
    );

    return (
        <li
            id={`nomi-${nomi.id}`}
            className={`${isSelected ? styles.selected : ""}`}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect();
            }}>
            <span
                className={`${styles.icon} ${getIconSize(Settings.list.iconSize)} ${getIconShape(Settings.list.iconShape)}`}>
                {/* Videos can't be cheaply proxied, so skip them when embedded. */}
                {media.video && !isEmbedded && (
                    <video src={media.video} loop muted autoPlay></video>
                )}
                <span
                    className={styles.img}
                    style={{ backgroundImage: img ? `url(${img})` : undefined }}
                />
            </span>
            <p>{nomi.name}</p>
        </li>
    );
};

export const NomiList = () => {
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
            {Nomis.list.nomi.map((nomi) => (
                <NomiItem
                    key={nomi.id}
                    nomi={nomi}
                    isSelected={Nomis.selected?.nomi?.id === nomi.id}
                    onSelect={() => {
                        if (Nomis.selected?.nomi?.id !== nomi.id)
                            selectNomi(nomi);
                    }}
                />
            ))}
        </>
    );
};
