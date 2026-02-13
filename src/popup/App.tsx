import { useEffect } from "react";
import "./app.styles.scss";
import { NomiList } from "./components/NomiList";
import { useSettings } from "./hooks/useSettings";
import { useNomi } from "./hooks/useNomi";

function App() {
    const { InitializeSettings } = useSettings();
    const { Nomis, checkSelectedNomi, fetchNomis } = useNomi();

    useEffect(() => {
        async function initialize() {
            InitializeSettings();
            await fetchNomis();
        }
        initialize();
    }, []);

    useEffect(() => {
        if (Nomis.list.length > 0) {
            checkSelectedNomi();
        }
    }, [Nomis.list, checkSelectedNomi]);

    return (
        // body
        <>
            <h1>Nomi Downloader</h1>
            <div className="main-container">
                <NomiList />
                <NomiList />
            </div>
        </>
    );
}

export default App;
