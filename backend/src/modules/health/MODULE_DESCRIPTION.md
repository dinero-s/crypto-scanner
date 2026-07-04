# Health

## Назначение
Healthchecks: liveness, readiness (MongoDB + Redis + collectors), scanner status.

## Структура
- `health.controller.ts` — `/health/live`, `/health/ready`, `/health/scanner`
- `services/scanner-health.service.ts` — статус collectors

## Зависимости
- `market-data` — collector status

## Что читать при изменениях
- `health.controller.ts`
- `services/scanner-health.service.ts`
