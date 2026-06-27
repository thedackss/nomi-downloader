import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { LoadingSpin } from "../LoadingSpin";
import { GroupList } from "./Group";
import { NomiList } from "./Nomi";
import styles from "./styles.module.scss";

export const List = () => {
    const { Nomis } = useNomi();
    const { menuOpen } = useSettings();

    return (
        <ul
            className={`${styles.nomiList}${menuOpen ? ` ${styles.noScroll}` : ""}`}>
            <LoadingSpin
                visible={Nomis.list.group === null || Nomis.list.nomi === null}
            />
            <GroupList />
            <NomiList />
        </ul>
    );
};
