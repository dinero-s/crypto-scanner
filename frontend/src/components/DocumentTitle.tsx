import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const APP_NAME = 'AI Marketplace';

const TITLES = {
  admin: `${APP_NAME} — Админ-панель`,
  seller: `${APP_NAME} — Панель продавца`,
} as const;

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = pathname.startsWith('/admin') ? TITLES.admin : TITLES.seller;
  }, [pathname]);

  return null;
}
