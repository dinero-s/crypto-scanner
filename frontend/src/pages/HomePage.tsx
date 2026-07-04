import { useAuth } from '../context/AuthContext';
import { Card, PageHeader } from '../components/ui/Page';

export function HomePage() {
  const { email } = useAuth();

  return (
    <div>
      <PageHeader
        title="crypto-scanner"
        subtitle="Стартовый каркас приложения. Добавьте свои модули и страницы."
      />
      <Card title="Добро пожаловать">
        <p>{email ? `Вы вошли как ${email}.` : 'Вы авторизованы.'}</p>
        <p>Используйте этот репозиторий как основу для нового проекта.</p>
      </Card>
    </div>
  );
}
