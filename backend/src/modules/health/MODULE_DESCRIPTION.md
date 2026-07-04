# Health

## Назначение
Проверки работоспособности приложения: liveness и readiness для оркестратора.

## Структура
- controllers: `health.controller.ts` (подключён напрямую в модуле, не через router)
- services: нет
- dto/entities: нет

## Основные потоки
- `GET /health/live` — приложение запущено.
- `GET /health/ready` — MongoDB и Redis доступны; при сбое — 503.

## Зависимости
- `ConfigModule` (параметры Redis), `@DatabaseConnection()` для MongoDB.
- Импортируется в `RoutesPublicModule` (публичные эндпоинты, `@Public()`).

## Что читать при изменениях
- `health.module.ts`, `health.controller.ts`.
