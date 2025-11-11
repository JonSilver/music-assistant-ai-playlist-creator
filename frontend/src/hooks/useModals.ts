import { useState, useCallback } from 'react';

interface UseModalsReturn {
    showSettings: boolean;
    showHistory: boolean;
    showRefine: boolean;
    openSettings: () => void;
    closeSettings: () => void;
    openHistory: () => void;
    closeHistory: () => void;
    openRefine: () => void;
    closeRefine: () => void;
}

export const useModals = (): UseModalsReturn => {
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showRefine, setShowRefine] = useState(false);

    const openSettings = useCallback((): void => {
        setShowSettings(true);
    }, []);

    const closeSettings = useCallback((): void => {
        setShowSettings(false);
    }, []);

    const openHistory = useCallback((): void => {
        setShowHistory(true);
    }, []);

    const closeHistory = useCallback((): void => {
        setShowHistory(false);
    }, []);

    const openRefine = useCallback((): void => {
        setShowRefine(true);
    }, []);

    const closeRefine = useCallback((): void => {
        setShowRefine(false);
    }, []);

    return {
        showSettings,
        showHistory,
        showRefine,
        openSettings,
        closeSettings,
        openHistory,
        closeHistory,
        openRefine,
        closeRefine
    };
};
