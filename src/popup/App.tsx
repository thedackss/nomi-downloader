import { useSettings } from "./hooks/useSettings";
import { NomiList } from "./components/NomiList";
import { NomiInfo } from "./components/NomiInfo";
import { Header } from "./components/Header";
import { useNomi } from "./hooks/useNomi";
import { useEffect } from "react";
import "./app.styles.scss";

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
            <Header />
            <div className="main-container">
                <NomiList />
                <NomiInfo />
            </div>
        </>
    );
}

export default App;
