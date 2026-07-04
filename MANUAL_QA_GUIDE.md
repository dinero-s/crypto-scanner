# Manual QA Guide

## Назначение
Документ описывает, как подготовить проект к ручному тестированию и какие сценарии проверять.

Подписки и оплата подписок сейчас не тестируются: в текущем MVP они не заложены.

## 1. Что нужно заранее
- Docker Desktop для MongoDB и Redis.
- Node.js и npm.
- Доступ к Ozon Seller API, если нужно тестировать реальные Ozon-сценарии.
- OpenAI-compatible API key только если нужно тестировать LLM-тексты рекомендаций.
- SMTP/Telegram credentials только если нужно тестировать реальную доставку уведомлений.

Без Ozon credentials можно тестировать auth, admin panel, health, навигацию, empty/error states и базовый UI.

## 2. Подготовка `.env`
Файл для backend находится здесь:

```bash
backend/.env
```

Если файла нет, создать из примера:

```bash
cd backend
cp .env.example .env
```

### 2.1. Важная настройка Redis
Если backend запускается локально вне Docker, нужно:

```env
REDIS_HOST=localhost
```

Значение `REDIS_HOST=redis` подходит только для запуска backend внутри Docker-сети.

### 2.2. Блок Ozon `.env`
Блок находится в `backend/.env`, рядом с настройками:

```env
# Ozon Marketplace Operator (только официальные API)
OZON_ENCRYPTION_KEY=CHANGE_ME_32_CHARS_MINIMUM_KEY__
OZON_ENCRYPTION_IV=CHANGE_ME_16CH
OZON_SELLER_API_BASE_URL=https://api-seller.ozon.ru
OZON_PERFORMANCE_API_BASE_URL=https://api-performance.ozon.ru
OZON_STATISTICS_API_BASE_URL=https://api-seller.ozon.ru
OZON_API_TIMEOUT_MS=30000
OZON_API_MAX_RETRIES=3
OZON_SYNC_CONCURRENCY=2
OZON_AI_ADVISOR_ENABLED=false
OZON_AI_PROVIDER=rule-based
OZON_OPENAI_API_KEY=
OZON_OPENAI_BASE_URL=https://api.openai.com/v1
OZON_OPENAI_MODEL=gpt-4o-mini
OZON_TELEGRAM_ALERTS_ENABLED=false
OZON_TELEGRAM_BOT_TOKEN=
OZON_EMAIL_ALERTS_ENABLED=false

# Feature flags (admin panel)
OZON_OPERATOR_ENABLED=true
WB_OPERATOR_ENABLED=false
LLM_ADVISOR_ENABLED=false
TELEGRAM_ALERTS_ENABLED=false
EMAIL_ALERTS_ENABLED=false
AUTO_SYNC_ENABLED=true
COMPETITOR_TRACKING_ENABLED=true
```

Что откуда брать:

- `OZON_ENCRYPTION_KEY`: локальный секрет минимум 32 символа. Нужен для шифрования Ozon API credentials в базе. Для QA можно сгенерировать случайную строку и не коммитить ее.
- `OZON_ENCRYPTION_IV`: локальный IV длиной 16 символов. Также не коммитить.
- `OZON_SELLER_API_BASE_URL`: оставить `https://api-seller.ozon.ru`.
- `OZON_PERFORMANCE_API_BASE_URL`: оставить `https://api-performance.ozon.ru`.
- `OZON_STATISTICS_API_BASE_URL`: оставить `https://api-seller.ozon.ru`.
- `OZON_API_TIMEOUT_MS`: оставить `30000`.
- `OZON_API_MAX_RETRIES`: оставить `3`.
- `OZON_SYNC_CONCURRENCY`: оставить `2`.
- `OZON_AI_ADVISOR_ENABLED`: включать `true` только для проверки LLM-рекомендаций.
- `OZON_AI_PROVIDER`: сейчас использовать `rule-based`.
- `OZON_OPENAI_API_KEY`: брать в OpenAI-compatible провайдере. Для обычного QA можно оставить пустым.
- `OZON_OPENAI_BASE_URL`: оставить `https://api.openai.com/v1` или заменить на URL совместимого провайдера.
- `OZON_OPENAI_MODEL`: оставить `gpt-4o-mini` или указать доступную модель провайдера.
- `OZON_TELEGRAM_ALERTS_ENABLED`: включать `true` только если есть Telegram bot token.
- `OZON_TELEGRAM_BOT_TOKEN`: брать у BotFather. Для обычного QA можно оставить пустым.
- `OZON_EMAIL_ALERTS_ENABLED`: включать `true` только если настроен SMTP.
- `OZON_OPERATOR_ENABLED`: оставить `true`.
- `WB_OPERATOR_ENABLED`: оставить `false`, WB сейчас не в scope.
- `LLM_ADVISOR_ENABLED`: включать `true` только вместе с `OZON_AI_ADVISOR_ENABLED=true` и API key.
- `TELEGRAM_ALERTS_ENABLED`: включать `true` только вместе с Telegram token.
- `EMAIL_ALERTS_ENABLED`: включать `true` только вместе с SMTP.
- `AUTO_SYNC_ENABLED`: оставить `true`, если нужно тестировать автосинхронизацию.
- `COMPETITOR_TRACKING_ENABLED`: оставить `true`, если нужно тестировать конкурентов.

### 2.3. Ozon Client-Id и Api-Key
Эти значения не лежат в `.env`.

Их вводит пользователь в UI при создании подключения Ozon:

```text
http://localhost:5173/ozon/connections
```

Брать их нужно в кабинете Ozon Seller. Без них нельзя полноценно проверить connection, health check, sync, products и competitors.

## 3. Основные URL

```text
Backend API: http://localhost:4001/api
Swagger: http://localhost:4001/api/docs
Frontend: http://localhost:5173
Admin UI: http://localhost:5173/admin/login
```

## 4. Smoke перед ручным тестом
Проверить:

```text
GET http://localhost:4001/api/health/live
GET http://localhost:4001/api/health/ready
```

Ожидание:

- `live` возвращает успешный ответ.
- `ready` возвращает успешный ответ, если MongoDB и Redis доступны.
- Swagger открывается.
- Frontend открывается.
- User login работает.
- Admin login работает.

Если `ready` падает, сначала проверить `DATABASE_URI`, `REDIS_HOST`, `REDIS_PASSWORD` и Docker-контейнеры.

## 5. User QA сценарии
### 5.1. Auth
1. Открыть `http://localhost:5173/login`.
2. Войти как `dev@ozon-operator.test / Test123`.
3. Проверить редирект на `/ozon/dashboard`.
4. Проверить email пользователя в layout.
5. Нажать logout.
6. Проверить редирект на `/login`.
7. Открыть `/ozon/dashboard` без токена.
8. Ожидание: редирект на login.

### 5.2. Ozon Dashboard
1. Открыть `/ozon/dashboard`.
2. Проверить loading state.
3. Проверить empty state, если данных нет.
4. Если есть connection и sync, проверить метрики, рекомендации и alerts.

### 5.3. Ozon Connections
1. Открыть `/ozon/connections`.
2. Проверить пустой список.
3. Нажать создание подключения.
4. Ввести seller name, Ozon Client-Id и Api-Key.
5. Проверить, что Api-Key не отображается в UI после сохранения.
6. Запустить health check.
7. Запустить sync.
8. Проверить audit по подключению.
9. Проверить удаление подключения.

Без реальных Ozon credentials сценарий создания подключения ожидаемо завершится ошибкой проверки credentials.

### 5.4. Products
1. Открыть `/ozon/products`.
2. Проверить empty state до sync.
3. После sync проверить список товаров.
4. Проверить поиск, фильтры и сортировку.
5. Открыть карточку товара.
6. Проверить analytics, snapshots, competitors, recommendations и alerts.

### 5.5. Competitors
1. Открыть `/ozon/competitors`.
2. Добавить конкурента по URL Ozon, SKU или product ID.
3. Связать конкурента со своим товаром, если список товаров есть.
4. Запустить sync конкурента.
5. Проверить статус и цену.
6. Удалить конкурента.

Важно: frontend не должен делать прямые HTTP-запросы к Ozon. URL передается только backend.

### 5.6. Recommendations
1. Открыть `/ozon/recommendations`.
2. Проверить список рекомендаций.
3. Проверить `aiSummary`/описание рекомендации.
4. Нажать resolve/ignore.
5. Проверить обновление статуса.

Если LLM выключен, рекомендации должны работать через rule-based fallback.

### 5.7. Alerts
1. Открыть `/ozon/alerts`.
2. Проверить список alerts.
3. Нажать отправку тестового alert.
4. Проверить появление события.
5. Если Telegram/Email выключены, доставка может быть skipped/failed. Это допустимо для локального QA.

### 5.8. Audit
1. Открыть audit по connection.
2. Проверить список событий.
3. Проверить фильтры по статусу, compliance decision, error code и датам.
4. Проверить, что секреты и токены не отображаются открытым текстом.

## 6. Admin QA сценарии
### 6.1. Admin Auth
1. Открыть `http://localhost:5173/admin/login`.
2. Войти как `admin@ozon-operator.test / Admin123`.
3. Проверить редирект на `/admin/overview`.
4. Проверить logout.

### 6.2. Overview
1. Открыть `/admin/overview`.
2. Проверить метрики пользователей, подключений, jobs, alerts и compliance.
3. Проверить блоки последних ошибок и статусов.

### 6.3. Users
1. Открыть `/admin/users`.
2. Проверить список, поиск и пагинацию.
3. Открыть detail пользователя.
4. Проверить block/unblock.
5. Проверить смену роли, если UI доступен.

### 6.4. Connections
1. Открыть `/admin/connections`.
2. Проверить список подключений.
3. Открыть detail.
4. Проверить health, sync, pause, resume и delete.

### 6.5. Jobs
1. Открыть `/admin/jobs`.
2. Проверить список задач.
3. Открыть detail.
4. Для failed job проверить retry.
5. Для waiting/delayed job проверить cancel.

### 6.6. Compliance, Audit, Alerts, Recommendations
Проверить страницы:

```text
/admin/compliance
/admin/audit
/admin/alerts
/admin/recommendations
```

Для каждой страницы:

- список открывается;
- detail открывается;
- статусы отображаются понятно;
- ошибки не показывают секреты;
- пустые состояния выглядят корректно.

### 6.7. Health и Feature Flags
Проверить:

```text
/admin/health
/admin/feature-flags
```

Ожидание:

- MongoDB и Redis отображаются как доступные.
- Feature flags соответствуют значениям в `.env`.

## 7. LLM QA
LLM не обязателен для MVP.

Чтобы проверить LLM:

```env
OZON_AI_ADVISOR_ENABLED=true
LLM_ADVISOR_ENABLED=true
OZON_OPENAI_API_KEY=ваш_api_key
OZON_OPENAI_BASE_URL=https://api.openai.com/v1
OZON_OPENAI_MODEL=gpt-4o-mini
```

После изменения `.env` перезапустить backend.

Проверка:

1. Создать Ozon connection.
2. Запустить sync.
3. Дождаться создания рекомендаций.
4. Открыть `/ozon/recommendations`.
5. Проверить, что текст рекомендации стал более естественным.

Если LLM недоступен, backend должен перейти на rule-based fallback и не ломать сценарий.

## 8. Что не тестировать сейчас
- Подписки и оплату подписок.
- WB operator.
- S3, если `MEDIA_STORAGE_DRIVER=local`.
- Google/Apple OAuth без credentials.
- Email registration flow без SMTP.
- Telegram delivery без bot token.
- LLM без API key.

## 9. Known Risks перед QA
- Backend lint сейчас может падать на unused imports/vars.
- E2E покрытие минимальное.
- Ozon env не валидируется полностью на старте.
- Register через UI без SMTP создает пользователя, который не сможет войти без подтверждения email.
- Для полного Ozon QA нужны реальные Ozon credentials.
- При локальном запуске вне Docker важно не забыть `REDIS_HOST=localhost`.

## 10. Минимальный порядок тестирования
1. Проверить health и Swagger.
2. Проверить user login/logout.
3. Проверить admin login/logout.
4. Пройти admin panel read-only страницы.
5. Пройти Ozon UI empty states.
6. Если есть Ozon credentials, создать connection и запустить sync.
7. Проверить products, competitors, recommendations, alerts и audit.
8. Проверить admin jobs/compliance/audit после sync.
