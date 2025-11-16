/* eslint-disable react-refresh/only-export-components */
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode
} from "react";
import type { GetSettingsResponse, UpdateSettingsRequest } from "@shared/types";
import { api } from "../services/api";

interface AppContextType {
    settings: GetSettingsResponse | null;
    loading: boolean;
    error: string | null;
    updateSettings: (updates: UpdateSettingsRequest) => Promise<Error | undefined>;
    refreshSettings: () => Promise<void>;
    selectedProviderId: string | null;
    setSelectedProviderId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
    const [settings, setSettings] = useState<GetSettingsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProviderId, setSelectedProviderIdState] = useState<string | null>(null);

    // Load last selected provider from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("selectedProviderId");
        if (stored !== null) {
            setSelectedProviderIdState(stored);
        }
    }, []);

    // Persist to localStorage when changed
    const setSelectedProviderId = useCallback((id: string): void => {
        setSelectedProviderIdState(id);
        localStorage.setItem("selectedProviderId", id);
    }, []);

    const refreshSettings = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        const [err, result] = await api.getSettings();

        if (err !== undefined) {
            setError(err.message);
        } else {
            setSettings(result);
            // If no provider selected yet and providers exist, select the first one
            const providers = result.aiProviders;
            if (selectedProviderId === null && providers.length > 0) {
                setSelectedProviderId(providers[0].id);
            }
        }

        setLoading(false);
    }, [selectedProviderId, setSelectedProviderId]);

    const updateSettings = async (updates: UpdateSettingsRequest): Promise<Error | undefined> => {
        const [err] = await api.updateSettings(updates);

        if (err !== undefined) {
            setError(err.message);
            return err;
        }

        await refreshSettings();
        return undefined;
    };

    useEffect(() => {
        void refreshSettings();
    }, [refreshSettings]);

    return (
        <AppContext.Provider
            value={{
                settings,
                loading,
                error,
                updateSettings,
                refreshSettings,
                selectedProviderId,
                setSelectedProviderId
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within AppProvider");
    }
    return context;
};
