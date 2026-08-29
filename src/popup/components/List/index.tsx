import { useNomi } from "../../hooks/useNomi";
import { useSettings } from "../../hooks/useSettings";
import { LoadingSpin } from "../LoadingSpin";
import { GroupList } from "./Group";
import { NomiList } from "./Nomi";
import styles from "./styles.module.scss";

export const List = () => {
    const { Nomis } = useNomi();
    const { menuOpen } = useSettings();

    // loadError renders the full-popup ConnectionState instead of this list;
    // the guard just makes sure the spinner can never outlive a failed load.
    const loading =
        (Nomis.list.group === null || Nomis.list.nomi === null) &&
        !Nomis.loadError;

    return (
        <ul
            className={`${styles.nomiList}${menuOpen ? ` ${styles.noScroll}` : ""}`}>
            <LoadingSpin visible={loading} />
            <GroupList />
            <NomiList />
        </ul>
    );
};
