import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SettingsFormValues } from '../schemas/settings.schema';
import { loadSettings, saveSettings } from '../storage/settingsStorage';

interface SettingsContextValue {
  settings: SettingsFormValues;
  updateSettings: (values: SettingsFormValues) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsFormValues>(() => loadSettings());

  const updateSettings = useCallback((values: SettingsFormValues) => {
    saveSettings(values);
    setSettings(values);
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
