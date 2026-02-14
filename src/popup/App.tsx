import { useEffect } from "react";
import "./app.styles.scss";
import { NomiList } from "./components/NomiList";
import { useSettings } from "./hooks/useSettings";
import { useNomi } from "./hooks/useNomi";
import { NomiInfo } from "./components/NomiInfo";

function App() {
    const { InitializeSettings } = useSettings();
    const { fetchNomis } = useNomi();

    useEffect(() => {
        async function initialize() {
            InitializeSettings();
            await fetchNomis();
        }
        initialize();
    }, []);

    return (
        // body
        <>
            <h1>Nomi Downloader</h1>
            <div className="main-container">
                <NomiList />
                <NomiInfo />
            </div>
        </>
    );
}

export default App;
