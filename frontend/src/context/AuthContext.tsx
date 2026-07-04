import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as loginRequest, type LoginPayload } from '../api/authApi';
import {
  clearTokens,
  getAccessToken,
  getUserEmail,
  isAuthenticated,
  setTokens,
} from '../api/authStorage';

interface AuthContextValue {
  isAuth: boolean;
  email: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(isAuthenticated);
  const [email, setEmail] = useState<string | null>(getUserEmail);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginRequest(payload);
    const userEmail = result.user.email ?? payload.email;
    setTokens(result.token, result.refresh_token, userEmail);
    setEmail(userEmail);
    setIsAuth(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setEmail(null);
    setIsAuth(false);
  }, []);

  const value = useMemo(
    () => ({ isAuth, email, login, logout }),
    [isAuth, email, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}

export function getStoredToken(): string | null {
  return getAccessToken();
}
