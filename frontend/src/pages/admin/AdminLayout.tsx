import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import layoutStyles from '../../components/layout/AppLayout.module.css';
import adminStyles from './AdminLayout.module.css';
import { ADMIN_NAV } from './adminRu';

export function AdminLayout() {
  const { email, role, logout } = useAdminAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className={layoutStyles.shell}>
      <aside
        className={`${layoutStyles.sidebar} ${navOpen ? adminStyles.navOpen : adminStyles.navCollapsed}`}
      >
        <div className={layoutStyles.brand}>
          <span className={layoutStyles.logo}>A</span>
          <div>
            <strong>AI Marketplace</strong>
            <small>Панель администратора</small>
          </div>
        </div>
        <button
          type="button"
          className={adminStyles.menuToggle}
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
        >
          {navOpen ? 'Скрыть меню' : 'Меню'}
        </button>
        <nav className={layoutStyles.nav}>
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${layoutStyles.link} ${layoutStyles.active}` : layoutStyles.link
              }
              onClick={() => setNavOpen(false)}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={layoutStyles.footer}>
          {email && <small className={layoutStyles.email}>{email}</small>}
          {role && <small className={layoutStyles.email}>{role}</small>}
          <button type="button" className={layoutStyles.logout} onClick={logout}>
            Выйти
          </button>
        </div>
      </aside>
      <div className={layoutStyles.contentArea}>
        <main className={layoutStyles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
