import { useNomi } from "../../hooks/useNomi";
import { LoadingSpin } from "../LoadingSpin";
import { GroupList } from "./Group";
import { NomiList } from "./Nomi";
import styles from "./styles.module.scss";

export const List = () => {
    const { Nomis } = useNomi();

    return (
        <ul className={styles.nomiList}>
            <LoadingSpin
                visible={Nomis.list.group === null || Nomis.list.nomi === null}
            />
            <GroupList />
            <NomiList />
        </ul>
    );
};
