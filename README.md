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
