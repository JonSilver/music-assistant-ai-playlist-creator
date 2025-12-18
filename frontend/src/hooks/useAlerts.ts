import { useContext } from "react";
import { AlertsContext } from "../contexts/AlertsContext";

export interface AlertsContextValue {
    error: string | null;
    successMessage: string | null;
    setError: (message: string) => void;
    setSuccess: (message: string) => void;
    clearError: () => void;
    clearSuccess: () => void;
}

export const useAlerts = (): AlertsContextValue => {
    const context = useContext(AlertsContext);
    if (context === null) 
        throw new Error("useAlerts must be used within AlertsProvider");
    
    return context;
};
