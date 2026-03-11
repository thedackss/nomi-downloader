import { useSettings } from "./hooks/useSettings";
import { List } from "./components/List";
import { Info } from "./components/Info";
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
                <Info />
            </div>
        </>
    );
}

export default App;
