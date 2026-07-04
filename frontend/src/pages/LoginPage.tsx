import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { register as registerRequest } from '../api/authApi';
import { isAuthenticated } from '../api/authStorage';
import { Button, Card, PageHeader } from '../components/ui/Page';
import { ErrorState } from '../components/ui/StateBlocks';
import { useAuth } from '../context/AuthContext';
import styles from '../components/ui/Page.module.css';
import loginStyles from './LoginPage.module.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/ozon/dashboard';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await registerRequest({ email, password, passwordConfirm });
      setInfo(
        result.message ??
          'Регистрация успешна. Подтвердите email и войдите.',
      );
      setMode('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={loginStyles.page}>
      <div className={loginStyles.panel}>
        <PageHeader
          title="Ozon Operator"
          subtitle={
            mode === 'login'
              ? 'Войдите для доступа к API'
              : 'Создайте аккаунт'
          }
        />

        <Card>
          <form
            className={styles.form}
            onSubmit={mode === 'login' ? handleLogin : handleRegister}
          >
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {mode === 'register' && (
              <div className={styles.field}>
                <label htmlFor="passwordConfirm">Подтверждение пароля</label>
                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
            {error && <ErrorState message={error} />}
            {info && <p className={loginStyles.info}>{info}</p>}
            <Button type="submit" disabled={loading}>
              {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
          </form>

          <p className={loginStyles.switch}>
            {mode === 'login' ? (
              <>
                Нет аккаунта?{' '}
                <button type="button" onClick={() => setMode('register')}>
                  Регистрация
                </button>
              </>
            ) : (
              <>
                Уже есть аккаунт?{' '}
                <button type="button" onClick={() => setMode('login')}>
                  Войти
                </button>
              </>
            )}
          </p>
        </Card>

        <p className={loginStyles.hint}>
          API Ozon доступен только авторизованным пользователям.
          После регистрации подтвердите email, если это требуется backend.
        </p>
      </div>
    </div>
  );
}
