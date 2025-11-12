import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppProvider } from "./contexts/AppContext";
import { AlertsProvider } from "./contexts/AlertsContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

const rootElement = document.getElementById("root");

if (rootElement === null) {
    throw new Error("Root element not found");
}

createRoot(rootElement).render(
    <StrictMode>
        <ErrorBoundary>
            <AppProvider>
                <AlertsProvider>
                    <App />
                </AlertsProvider>
            </AppProvider>
        </ErrorBoundary>
    </StrictMode>
);
