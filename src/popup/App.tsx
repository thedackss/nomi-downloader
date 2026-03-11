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

    useEffect(() => {
        async function initialize() {
            InitializeSettings();
            await fetchGroups();
            await fetchNomis();
        }
        initialize();
    }, []);
    useEffect(() => {
        async function initialize() {
            await checkSelectedNomi();
        }
        initialize();
    }, [Nomis.list]);

    const hasSelection = Nomis.selected.nomi || Nomis.selected.group;

    console.log("Selected Nomi:", Nomis.selected.nomi);

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
