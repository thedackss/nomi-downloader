import type React from "react";
import { useEffect, useState } from "react";
import { getNomiMedia } from "../../../nomi/media";
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

    // One hero tile per source: the actual video when there is one (a
    // video-profile Nomi), otherwise the best still — preferring the video
    // preview so video profiles still resolve, like the list.
    const tileFor = (n: Parameters<typeof getNomiMedia>[0]) => {
        const m = getNomiMedia(n);
        return {
            id: n.id,
            video: m.video,
            still: m.videoPrev || m.edit || m.selfie || m.default,
        };
    };

    let heroTiles: ReturnType<typeof tileFor>[] = [];

    if (isMobile) {
        if (Nomi) {
            heroTiles = [tileFor(Nomi)];
        } else if (Group) {
            heroTiles = Group.nomis
                .filter((n) => !n.removed)
                .slice(0, 4)
                .map(tileFor);
        }
    }

    // The blurred backdrop only needs stills (videos can't be CSS backgrounds).
    const bgImages = heroTiles.map((t) => t.still);

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
            {/* Mobile is one-pane: selecting hides the list (and its avatar), so
                surface the picture here. Desktop keeps the list visible. */}
            {isMobile && heroTiles.length > 0 && (
                <div className={styles.hero}>
                    {heroTiles.map((tile) =>
                        tile.video ? (
                            <video
                                key={tile.id}
                                className={styles.heroVideo}
                                src={tile.video}
                                poster={tile.still}
                                loop
                                muted
                                autoPlay
                            />
                        ) : (
                            <span
                                key={tile.id}
                                className={styles.heroImg}
                                style={{
                                    backgroundImage: `url(${tile.still})`,
                                }}
                            />
                        ),
                    )}
                </div>
            )}
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
