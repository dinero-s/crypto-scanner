# Mini App API

## Назначение
REST-фасад для Telegram Mini App frontend: dashboard, opportunities, exchanges, health.

## Структура
- `controllers/` — публичные эндпоинты `/mini-app/*`
- `services/` — агрегация arbitrage + market-data + exchanges
- `dto/` — query/response контракты

## Основные потоки
- Frontend → `/mini-app/dashboard`, `/mini-app/opportunities/*`
- Без торговых операций — только аналитика

## Зависимости
- `arbitrage`, `market-data`, `exchanges`
- Роутинг: `routes.public.module.ts`

## Что читать при изменениях
- `controllers/mini-app.controller.ts`
- `services/mini-app-api.service.ts`
