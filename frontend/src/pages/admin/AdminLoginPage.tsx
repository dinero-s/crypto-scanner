import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button, Card, PageHeader } from '../../components/ui/Page';
import { ErrorState } from '../../components/ui/StateBlocks';
import styles from '../../components/ui/Page.module.css';
import loginStyles from '../LoginPage.module.css';

export function AdminLoginPage() {
  const { isAuth, login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuth) {
    return <Navigate to="/admin/users" replace />;
  }

  return (
    <div className={loginStyles.page}>
      <div className={loginStyles.panel}>
        <PageHeader
          title="Вход администратора"
          subtitle="Панель администратора crypto-scanner"
        />
        <Card>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              setLoading(true);
              setError(null);
              void login({ email, password })
                .catch(() => setError('Неверный email или пароль'))
                .finally(() => setLoading(false));
            }}
          >
            <div className={styles.field}>
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="admin-password">Пароль</label>
              <input
                id="admin-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <ErrorState message={error} />}
            <Button type="submit" disabled={loading}>
              Войти
            </Button>
          </form>
        </Card>
        <p className={loginStyles.hint}>
          Доступ только для администраторов платформы.
        </p>
      </div>
    </div>
  );
}
