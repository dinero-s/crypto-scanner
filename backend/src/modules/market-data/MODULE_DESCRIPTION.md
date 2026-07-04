# Market Data

## Назначение
Сбор и хранение публичных рыночных данных: spot, futures, funding rate, open interest.

## Структура
- `entities/` — MongoDB-снимки цен и funding
- `repositories/` — доступ к БД
- `services/` — коллекторы по типам данных
- `dto/` — параметры сбора и запросов

## Основные потоки
- BullMQ job → `MarketDataCollectorService.collectAll()`
- Отдельные сервисы: spot, futures, funding, OI
- Снимки сохраняются через `MarketDataRepository`

## Зависимости
- `exchanges` — адаптеры бирж
- `jobs` — периодический сбор
- Redis — кэш (этап 2)

## Что читать при изменениях
- `services/market-data-collector.service.ts`
- `repositories/market-data.repository.ts`
