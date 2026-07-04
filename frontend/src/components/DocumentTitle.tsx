import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const APP_NAME = 'crypto-scanner';

const TITLES = {
  admin: `${APP_NAME} — Админ-панель`,
  app: APP_NAME,
} as const;

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = pathname.startsWith('/admin') ? TITLES.admin : TITLES.app;
  }, [pathname]);

  return null;
}
