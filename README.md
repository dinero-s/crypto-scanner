# crypto-scanner

MVP сканера криптоарбитража: сбор публичных market data с бирж, расчёт Funding Rate и Cash & Carry возможностей, Telegram Mini App и алерты.

> **Risk disclaimer:** проект предоставляет информационные сигналы. Это не финансовый совет. Торговля криптовалютами сопряжена с высоким риском. Расчёты net yield используют типовые комиссии и slippage — реальное исполнение может отличаться. **Торговля, приватные API-ключи бирж и хранение seed/private данных не реализованы и не планируются в MVP.**

## Структура проекта

```
crypto-scanner/
├── backend/                 # NestJS API (MongoDB, Redis, BullMQ)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── exchanges/   # Коннекторы и нормализаторы бирж
│   │   │   ├── market-data/ # Collectors, Redis-кэш, snapshots
│   │   │   ├── arbitrage/   # Расчёт, scoring, фильтры
│   │   │   ├── alerts/      # Telegram-алерты, dedup/cooldown
│   │   │   ├── telegram-bot/
│   │   │   ├── telegram-users/
│   │   │   └── mini-app-api/
│   │   └── jobs/            # BullMQ workers, scheduler
│   ├── Dockerfile
│   └── .env.example
├── frontend/                # React + Vite (admin + Telegram Mini App)
│   ├── src/mini-app/        # Mini App UI
│   ├── Dockerfile
│   └── .env.example
├── docker/
│   └── nginx/               # Опциональный reverse proxy
├── docker-compose.yml       # backend + frontend + mongo + redis (+ nginx)
└── package.json             # Monorepo scripts
```

## Быстрый старт (локально)

### 1. Инфраструктура (MongoDB + Redis)

```bash
cp backend/.env.example backend/.env
# Отредактируйте backend/.env — задайте пароли и секреты

docker compose up -d mongo redis
```

При первом запуске Mongo инициализируется с credentials из `.env`.  
Если видите `Authentication failed`:

```bash
docker compose down -v
docker compose up -d mongo redis
```

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

API: `http://localhost:4001/api`  
Swagger: `http://localhost:4001/api/docs`

С включёнными scanner jobs:

```bash
SCANNER_JOBS_ENABLED=true JOB_ENABLE=true npm run start:dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- Admin UI: `http://localhost:5173`
- Mini App: `http://localhost:5173/mini-app`

### Monorepo scripts (из корня)

```bash
npm run start:dev      # backend dev
npm run dev:frontend   # frontend dev
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Docker (полный стек)

```bash
cp backend/.env.example backend/.env
# Заполните DATABASE_PASSWORD, REDIS_PASSWORD, JWT secrets

docker compose up -d --build
```

| Сервис | URL |
|--------|-----|
| Backend API | http://localhost:4001/api |
| Frontend (nginx) | http://localhost:5173 |
| MongoDB | localhost:27018 |
| Redis | localhost:6379 |

С внешним nginx (единая точка входа на :80):

```bash
docker compose --profile nginx up -d --build
# → http://localhost
```

## Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather) → получите `TELEGRAM_BOT_TOKEN`.
2. В `backend/.env`:
   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC...
   TELEGRAM_MINI_APP_URL=https://t.me/your_bot/app
   TELEGRAM_ALERTS_ENABLED=true
   ```
3. **Локальная разработка** — long polling:
   ```env
   TELEGRAM_USE_POLLING=true
   ```
4. **Production** — webhook:
   ```env
   TELEGRAM_USE_POLLING=false
   TELEGRAM_WEBHOOK_SECRET=your_random_secret
   ```
   Зарегистрируйте webhook:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```

### Mini App

1. В BotFather: `/newapp` → привяжите URL фронтенда (HTTPS обязателен в production).
2. `TELEGRAM_MINI_APP_URL` = ссылка вида `https://t.me/your_bot/app`.
3. Frontend отправляет `initData` на `POST /api/telegram-users/auth`.
4. Backend валидирует подпись HMAC-SHA256 (`TelegramInitDataService`).
5. Защищённые роуты Mini App могут использовать `@TelegramAuth()` + заголовок `X-Telegram-Init-Data`.

## Подключённые биржи

Все биржи используют **только публичные REST API** — без API-ключей и без торговли.

| Биржа | Spot | Perp | Funding | Open Interest | Instruments |
|-------|------|------|---------|---------------|-------------|
| Binance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bybit | ✅ | ✅ | ✅ | ✅ | ✅ |
| OKX | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gate.io | ✅ | ✅ | ✅ | ✅ | ✅ |
| KuCoin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kraken | ✅ | ✅ | ✅ | ✅ | ✅ |

Список активных бирж: `SCANNER_ENABLED_EXCHANGES=binance,bybit,okx,gate,kucoin,kraken`

## Собираемые данные

- **Spot tickers** — bid/ask/last/volume24h
- **Perp tickers** — mark/index price, volume, open interest
- **Funding rates** — текущий и predicted rate, next funding time
- **Open interest** — OI по perpetual контрактам
- **Instruments** — торговые пары, tick/step size, статус
- **Exchange health** — latency, last error, availability
- **Arbitrage opportunities** — funding + cash & carry с net yield, scores
- **Market data snapshots** — исторические снимки (TTL настраивается)

## API Endpoints

Базовый prefix: `/api`

### Health (public)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness (Mongo + Redis + collectors) |
| GET | `/health/scanner` | Детальный статус collectors |
| GET | `/health/exchanges` | Статус доступности бирж |

### Arbitrage (public)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/arbitrage/funding` | Funding Rate opportunities |
| GET | `/arbitrage/cash-carry` | Cash & Carry opportunities |
| GET | `/arbitrage/top` | Top по opportunityScore |
| GET | `/arbitrage/stats` | Статистика |
| GET | `/arbitrage/:id` | Детали возможности |

### Mini App (public)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/mini-app/dashboard` | Сводка для главного экрана |
| GET | `/mini-app/opportunities/funding` | Funding opportunities |
| GET | `/mini-app/opportunities/cash-carry` | Cash & Carry opportunities |
| GET | `/mini-app/exchanges` | Список бирж |
| GET | `/mini-app/health` | Статус сканера |

### Telegram (public)

| Method | Path | Описание |
|--------|------|----------|
| POST | `/telegram-users/auth` | Авторизация через initData |
| POST | `/telegram/webhook` | Webhook Bot API |

### User (auth required)

| Method | Path | Описание |
|--------|------|----------|
| GET/PATCH | `/user/alerts/settings` | Настройки алертов |

### Admin (auth required)

| Method | Path | Описание |
|--------|------|----------|
| GET | `/admin/market-data/latest/spot` | Latest spot из Redis |
| GET | `/admin/market-data/latest/perp` | Latest perp из Redis |
| GET | `/admin/market-data/latest/funding` | Latest funding из Redis |

## Collectors (как работают)

```
Scheduler (cron) → BullMQ queue → Worker → Exchange connector → Normalizer → Redis cache + MongoDB snapshot
                                      ↓
                              Arbitrage calculate job → Opportunities → Alert dispatch
```

1. **ScannerDynamicSchedulerService** ставит repeatable jobs в BullMQ с интервалами из env.
2. **MarketDataCollectProcessor** вызывает `MarketDataCollectorService`:
   - instruments (раз в 6ч по умолчанию)
   - spot/perp tickers (45 сек)
   - funding rates / open interest (180 сек)
3. Данные нормализуются в единый формат (`BTC/USDT`, decimal prices).
4. Redis — hot cache (TTL `SCANNER_MARKET_DATA_CACHE_TTL_SEC`).
5. MongoDB — snapshots и exchange health.
6. **ArbitrageCalculateProcessor** пересчитывает opportunities каждые 45 сек.

## Scoring (как работает)

`ArbitrageScoringService` вычисляет два показателя (0–100):

**Risk Score** (выше = рискованнее):
- Низкий volume относительно порога → +10..+40
- Широкий spread → +10..+35
- Расхождение funding vs predicted → +10..+20

**Opportunity Score** (выше = лучше):
- `netYieldPercent × 10` + volume bonus (до +20) − `riskScore × 0.3`

Net yield рассчитывается с учётом `SCANNER_DEFAULT_SPOT_FEE_RATE`, `SCANNER_DEFAULT_FUTURES_FEE_RATE`, `SCANNER_DEFAULT_SLIPPAGE`.

## Безопасность

| Мера | Статус |
|------|--------|
| Нет приватных API-ключей бирж | ✅ Только public REST |
| Нет торговли | ✅ Read-only |
| Нет seed/private keys | ✅ |
| Telegram initData HMAC validation | ✅ `TelegramInitDataService` |
| Rate limiting (Throttler + Redis) | ✅ `THROTTLE_ENABLE` |
| CORS whitelist | ✅ `CORS_ALLOW_ORIGINS` |
| Helmet | ✅ CSP в production |
| ValidationPipe whitelist | ✅ |
| Graceful BullMQ shutdown | ✅ SIGTERM/SIGINT |
| Centralized error handling | ✅ `AppGeneralFilter` |

## Ограничения MVP

- Нет автоматической торговли и ордеров
- Нет withdrawal/deposit tracking
- Нет cross-exchange transfer cost
- Subscription mock (всегда FREE)
- JWT auth для Mini App — initData validation готова, полноценный token flow — TODO
- Kraken spot — ограниченный набор USDT пар
- Funding interval для некоторых бирж — фиксированная оценка (8h)
- Нет WebSocket streaming (только REST polling)
- Admin panel — legacy от шаблона, не часть scanner MVP

## Dev-учётные записи

```bash
cd backend && npm run seed:dev
```

- Админ: `admin@crypto-scanner.test` / `Admin123` → `/admin/login`
- Пользователь: `dev@crypto-scanner.test` / `Test123` → `/login`

## TODO перед production

- [ ] HTTPS + Let's Encrypt для Mini App URL
- [ ] Настроить Telegram webhook с secret token
- [ ] Сгенерировать production secrets (JWT, Redis, Mongo)
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `THROTTLE_ENABLE=true`
- [ ] Мониторинг (Sentry DSN, alerting на `/health/ready`)
- [ ] Backup MongoDB (`scripts/backup.sh`)
- [ ] Rate limits бирж — мониторинг 429 errors
- [ ] Полноценный JWT/session flow для Mini App после initData auth
- [ ] Load testing collectors при полном списке символов

## Лицензия

Private / UNLICENSED
