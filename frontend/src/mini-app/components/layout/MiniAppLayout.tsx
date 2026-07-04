import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '../../context/TelegramProvider';
import styles from './MiniAppLayout.module.css';

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z" />
        </svg>
      );
    case 'funding':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 7H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" />
        </svg>
      );
    case 'cash':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    default:
      return null;
  }
}

const NAV_ITEMS = [
  { to: '/mini-app', label: 'Главная', icon: 'home', end: true },
  { to: '/mini-app/funding', label: 'Funding', icon: 'funding' },
  { to: '/mini-app/cash-carry', label: 'C&C', icon: 'cash' },
  { to: '/mini-app/settings', label: 'Настройки', icon: 'settings' },
];

const PAGE_TITLES: Record<string, string> = {
  '/mini-app': 'Crypto Scanner',
  '/mini-app/funding': 'Funding',
  '/mini-app/cash-carry': 'Cash & Carry',
  '/mini-app/settings': 'Настройки',
};

export function MiniAppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useTelegram();

  const isDetail = location.pathname.includes('/opportunity/');
  const basePath = isDetail ? '' : location.pathname;
  const title = isDetail ? 'Детали' : (PAGE_TITLES[basePath] ?? 'Crypto Scanner');

  return (
    <div className={`mini-app-root ${styles.layout}`}>
      <header className={styles.header}>
        <div>
          {isDetail ? (
            <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
              ← Назад
            </button>
          ) : (
            <>
              <h1 className={styles.headerTitle}>{title}</h1>
              {user?.username && <p className={styles.headerSub}>@{user.username}</p>}
            </>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      {!isDetail && (
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? styles.navLinkActive : styles.navLink)}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
