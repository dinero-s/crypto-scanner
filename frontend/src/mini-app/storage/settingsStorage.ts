import type { SettingsFormValues } from '../schemas/settings.schema';
import { defaultSettings } from '../schemas/settings.schema';

const SETTINGS_KEY = 'mini-app:settings';

export function loadSettings(): SettingsFormValues {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as SettingsFormValues;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SettingsFormValues): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
