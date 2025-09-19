import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

/**
 * Global settings interface describing user preferences to persist.
 * Matches the structure expected by SettingsDialog.
 */
export interface GeneralSettings {
  theme?: string;
  useFirefoxContainers: boolean;
  [key: string]: any;
}

export interface Settings {
  General: GeneralSettings;
  [key: string]: any;
}
import { getSettings, putSettings } from "./idb";

interface SettingsContextType {
  settings: Settings | undefined;
  loading: boolean;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  reloadSettings: () => void;
  formatLink: (containerName: string, href: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const reloadSettings = useCallback(() => {
    setLoading(true);
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    reloadSettings();
  }, [reloadSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      if (!settings) return;
      const merged = { ...settings, ...updates };
      await putSettings(merged);
      setSettings(merged);
    },
    [settings]
  );

  // Format link based on Firefox Containers setting
  const formatLink = useCallback(
    (containerName: string, href: string) => {
      if (settings?.General?.useFirefoxContainers) {
        return `ext+container:name=${containerName}&url=${href}`;
      }
      return href;
    },
    [settings]
  );

  return (
    <SettingsContext.Provider
      value={{ settings, loading, updateSettings, reloadSettings, formatLink }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used within a SettingsProvider");
  return ctx.settings;
}

export function useUpdateSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useUpdateSettings must be used within a SettingsProvider");
  return ctx.updateSettings;
}

export function useFormatLink() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useFormatLink must be used within a SettingsProvider");
  return ctx.formatLink;
}
