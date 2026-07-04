# crypto-scanner

Monorepo: NestJS backend + React frontend — стартовый каркас для нового проекта.

## Структура

```
backend/   — NestJS API (MongoDB, Redis, BullMQ)
frontend/  — React + Vite UI
```

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

API: `http://localhost:4001/api`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://localhost:5173` (proxy на backend `/api`)

### Telegram Mini App

```bash
cd frontend
cp .env.example .env
npm run dev
```

Mini App UI: `http://localhost:5173/mini-app`

- Тёмная mobile-first тема
- Pull-to-refresh, skeleton/empty/error states
- API через `VITE_API_BASE_URL` (по умолчанию `/api`)
- Telegram WebApp SDK + отправка `initData` на `/api/telegram-users/auth`

## Docker (MongoDB + Redis для локальной разработки)

```bash
cd backend
docker compose up -d mongo redis
```

Важно: запускайте из `backend/`, чтобы docker compose подхватил `backend/.env`.
При первом запуске Mongo инициализируется с credentials из `.env`.
Если видите `Authentication failed` — пересоздайте том:

```bash
cd backend
docker compose down -v
docker compose up -d mongo redis
```

Затем перезапустите backend: `npm run start:dev`

## Dev-учётные записи

```bash
cd backend
npm run seed:dev
```

- Админ: `admin@crypto-scanner.test` / `Admin123` → `/admin/login`
- Пользователь: `dev@crypto-scanner.test` / `Test123` → `/login`

## Админ-панель

После входа администратора доступны разделы:

- **Пользователи** — список, блокировка, детали
- **Журнал аудита** — действия администраторов
