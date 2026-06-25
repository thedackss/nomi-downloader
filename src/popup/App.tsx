import { useEffect } from "react";
import { Header } from "./components/Header";
import { Info } from "./components/Info";
import { List } from "./components/List";
import { useNomi } from "./hooks/useNomi";
import { useSettings } from "./hooks/useSettings";
import "./app.styles.scss";

function App() {
    const { InitializeSettings, isMobile } = useSettings();
    const { fetchNomis, fetchGroups, checkSelectedNomi, Nomis } = useNomi();

    // biome-ignore lint/correctness/useExhaustiveDependencies: bootstrap settings and lists once on mount
    useEffect(() => {
        async function initialize() {
            InitializeSettings();
            await fetchGroups();
            await fetchNomis();
        }
        initialize();
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
