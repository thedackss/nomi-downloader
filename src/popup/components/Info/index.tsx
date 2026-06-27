import type React from "react";
import { useEffect, useState } from "react";
import { getNomiImageUrl } from "../../../nomi/media";
import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { LoadingSpin } from "../LoadingSpin";
import { Stats } from "../Stats";
import { GroupInfo } from "./Group";
import { NomiInfo } from "./Nomi";
import styles from "./styles.module.scss";

export const Info = () => {
    const { Nomis } = useNomi();
    const { isMobile } = useSettings();

    const [loading, setLoading] = useState(true);

    const Nomi = Nomis.selected.nomi;
    const Group = Nomis.selected.group;

    const bgImages: string[] = [];

    if (isMobile) {
        if (Nomi) {
            bgImages.push(getNomiImageUrl(Nomi));
        } else if (Group) {
            bgImages.push(...Group.nomis.slice(0, 4).map(getNomiImageUrl));
        }
    }

    let bgStyle: React.CSSProperties | undefined;
    if (bgImages.length > 0) {
        bgStyle = {
            "--bg-image-1": `url(${bgImages[0]})`,
            ...(bgImages[1] && { "--bg-image-2": `url(${bgImages[1]})` }),
            ...(bgImages[2] && { "--bg-image-3": `url(${bgImages[2]})` }),
            ...(bgImages[3] && { "--bg-image-4": `url(${bgImages[3]})` }),
        } as React.CSSProperties;
    }

    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <div
            className={styles.nomiInfo}
            style={bgStyle}
            data-bg={bgImages.length > 0 ? "" : undefined}>
            {(() => {
                if (Nomi) {
                    return <NomiInfo nomi={Nomi} />;
                } else if (Group) {
                    return <GroupInfo group={Group} />;
                } else {
                    return (
                        <div className={styles.emptyState}>
                            <Stats />
                            <span className={styles.noNomiSelected}>
                                No Nomi selected
                            </span>
                        </div>
                    );
                }
            })()}
            <LoadingSpin visible={loading} />
        </div>
    );
};
