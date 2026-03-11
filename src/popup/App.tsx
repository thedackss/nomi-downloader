import { useSettings } from "./hooks/useSettings";
import { List } from "./components/List";
import { Info } from "./components/Info";
import { Header } from "./components/Header";
import { useNomi } from "./hooks/useNomi";
import { useEffect } from "react";
import "./app.styles.scss";

function App() {
    const { InitializeSettings, isMobile } = useSettings();
    const { fetchNomis, fetchGroups, Nomis } = useNomi();

    useEffect(() => {
        async function initialize() {
            InitializeSettings();
            await fetchGroups();
            await fetchNomis();
        }
        initialize();
    }, []);

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
