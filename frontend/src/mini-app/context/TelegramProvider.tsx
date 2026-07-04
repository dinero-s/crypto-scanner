import WebApp from '@twa-dev/sdk';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authenticateWithInitData } from '../api/telegramApi';
import { setTelegramToken } from '../storage/telegramAuthStorage';

export interface TelegramUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

interface TelegramContextValue {
  isReady: boolean;
  initData: string;
  user: TelegramUser | null;
  colorScheme: 'light' | 'dark';
  isAuthenticated: boolean;
  authError: string | null;
  expand: () => void;
  haptic: (type?: 'light' | 'medium' | 'heavy') => void;
}

const TelegramContext = createContext<TelegramContextValue | null>(null);

function parseTelegramUser(): TelegramUser | null {
  const raw = WebApp.initDataUnsafe.user;
  if (!raw) return null;
  return {
    id: raw.id,
    username: raw.username,
    firstName: raw.first_name,
    lastName: raw.last_name,
    languageCode: raw.language_code,
  };
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    document.documentElement.dataset.telegramTheme = WebApp.colorScheme;
    setIsReady(true);

    const initData = WebApp.initData;
    if (!initData) {
      setAuthError(null);
      return;
    }

    void authenticateWithInitData(initData)
      .then((response) => {
        if (response.token) {
          setTelegramToken(response.token);
        }
        setIsAuthenticated(response.authenticated || Boolean(response.token));
        if (response.message && !response.authenticated) {
          setAuthError(response.message);
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Ошибка авторизации';
        setAuthError(message);
      });
  }, []);

  const expand = useCallback(() => {
    WebApp.expand();
  }, []);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred(type);
    }
  }, []);

  const value = useMemo<TelegramContextValue>(
    () => ({
      isReady,
      initData: WebApp.initData,
      user: parseTelegramUser(),
      colorScheme: WebApp.colorScheme,
      isAuthenticated,
      authError,
      expand,
      haptic,
    }),
    [isReady, isAuthenticated, authError, expand, haptic],
  );

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram(): TelegramContextValue {
  const ctx = useContext(TelegramContext);
  if (!ctx) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return ctx;
}
