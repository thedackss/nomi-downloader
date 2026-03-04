import { useSettings } from "./hooks/useSettings";
import { List } from "./components/List";
import { NomiInfo } from "./components/NomiInfo";
import { Header } from "./components/Header";
import { useNomi } from "./hooks/useNomi";
import { useEffect } from "react";
import "./app.styles.scss";

function App() {
    const { InitializeSettings } = useSettings();
    const { fetchNomis, fetchGroups } = useNomi();

    useEffect(() => {
        async function initialize() {
            InitializeSettings();
            await fetchGroups();
            await fetchNomis();
        }
        initialize();
    }, []);

    return (
        // body
        <>
            <Header />
            <div className="main-container">
                <List />
                <NomiInfo />
            </div>
        </>
    );
}

export default App;
