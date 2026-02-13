import { ContextProvider } from "./components/ContextProvider.tsx";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ContextProvider>
            <App />
        </ContextProvider>
    </StrictMode>,
);
