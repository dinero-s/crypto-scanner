import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [{ to: '/', label: 'Главная', icon: '🏠' }] as const;

export function AppLayout() {
  const { logout, email } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    void navigate('/login');
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.logo}>C</span>
          <div>
            <strong>crypto-scanner</strong>
            <small>Личный кабинет</small>
          </div>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.footer}>
          {email && <small className={styles.email}>{email}</small>}
          <button type="button" className={styles.logout} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </aside>
      <div className={styles.contentArea}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
