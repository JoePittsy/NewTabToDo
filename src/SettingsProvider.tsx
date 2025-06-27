import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings, putSettings } from './idb';
import type { Settings } from './SettingsDialog';

interface SettingsContextType {
    settings: Settings | undefined;
    loading: boolean;
    updateSettings: (updates: Partial<Settings>) => Promise<void>;
    reloadSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const reloadSettings = useCallback(() => {
        setLoading(true);
        getSettings().then(s => {
            setSettings(s);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        reloadSettings();
    }, [reloadSettings]);

    const updateSettings = useCallback(async (updates: Partial<Settings>) => {
        if (!settings) return;
        const merged = { ...settings, ...updates };
        await putSettings(merged);
        setSettings(merged);
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, loading, updateSettings, reloadSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
    return ctx.settings;
}

export function useUpdateSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error('useUpdateSettings must be used within a SettingsProvider');
    return ctx.updateSettings;
}
