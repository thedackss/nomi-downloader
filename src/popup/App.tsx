import { useSettings } from "./hooks/useSettings";
import { List } from "./components/List";
import { Info } from "./components/Info";
import { Header } from "./components/Header";
import { useNomi } from "./hooks/useNomi";
import { useEffect } from "react";
import "./app.styles.scss";

function App() {
    const { InitializeSettings, isMobile } = useSettings();
    const { fetchNomis, fetchGroups, checkSelectedNomi, Nomis } = useNomi();

    // Bootstrap settings and lists once on mount.
    useEffect(() => {
        async function initialize() {
            InitializeSettings();
            await fetchGroups();
            await fetchNomis();
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-resolve the selection whenever the loaded lists change.
    useEffect(() => {
        checkSelectedNomi();
    }, [checkSelectedNomi]);

    const hasSelection = Nomis.selected.nomi || Nomis.selected.group;

    return (
        <div className={isMobile ? "mobile" : "desktop"}>
            <Header />
            <div className="main-container">
                {isMobile ? (
                    hasSelection ? (
                        <Info />
                    ) : (
                        <List />
                    )
                ) : (
                    <>
                        <List />
                        <Info />
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
