# Market Data

## Назначение
Сбор, хранение и кэширование публичных рыночных данных: spot, perp, funding rate, open interest, инструменты.

## Структура
- `entities/` — MongoDB: `exchange_instruments`, `spot_tickers`, `perp_tickers`, `funding_rates`, `market_data_snapshots`, `exchange_health_statuses`
- `repositories/` — доступ к БД (MarketData, ExchangeInstrument, ExchangeHealth)
- `services/` — коллекторы, Redis-кэш, health, query API
- `controllers/` — admin API latest market data
- `dto/` — параметры сбора и запросов

## Основные потоки
- BullMQ granular jobs → коллекторы → Mongo + Redis
- `ExchangeHealthService.collectPerExchange` — partial results, health после каждой попытки
- Admin: `GET /admin/market-data/latest/{spot|perp|funding}`
- Public: `GET /health/exchanges`

## Зависимости
- `exchanges` — connectors и normalizers
- `jobs` — BullMQ + dynamic scheduler
- Redis — latest-кэш (`scanner:cache:*`)

## Что читать при изменениях
- `services/market-data-collector.service.ts`
- `services/exchange-health.service.ts`
- `services/market-data-cache.service.ts`
- `repositories/market-data.repository.ts`
