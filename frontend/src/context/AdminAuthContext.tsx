import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminLogin } from '../api/admin/adminApi';
import {
  clearAdminTokens,
  getAdminEmail,
  getAdminRole,
  isAdminAuthenticated,
  setAdminTokens,
} from '../api/admin/adminAuthStorage';

interface AdminAuthContextValue {
  isAuth: boolean;
  email: string | null;
  role: string | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(isAdminAuthenticated);
  const [email, setEmail] = useState(getAdminEmail);
  const [role, setRole] = useState(getAdminRole);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const response = await adminLogin(payload);
    setAdminTokens({
      token: response.token,
      refresh_token: response.refresh_token,
      email: response.admin.email,
      role: response.admin.role,
    });
    setIsAuth(true);
    setEmail(response.admin.email);
    setRole(response.admin.role);
  }, []);

  const logout = useCallback(() => {
    clearAdminTokens();
    setIsAuth(false);
    setEmail(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({ isAuth, email, role, login, logout }),
    [isAuth, email, role, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
