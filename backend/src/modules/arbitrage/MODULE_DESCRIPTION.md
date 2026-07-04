# Arbitrage

## Назначение
Расчёт арбитражных возможностей: Funding Rate и Cash & Carry с net yield, scoring и публичным API.

## Структура
- `controllers/` — REST `/arbitrage/*`
- `services/` — расчёт, фильтрация, scoring, API
- `utils/` — Decimal.js математика
- `repositories/` — MongoDB `arbitrage_opportunities`
- `entities/` — схема возможности
- `dto/` — query/response контракты

## Основные потоки
- BullMQ job `scanner-arbitrage-calculate` → `FundingArbitrageService.recalculate()` + `CashCarryArbitrageService.recalculate()`
- Данные из Redis cache (spot/perp/funding) → расчёт → MongoDB
- API: `GET /arbitrage/funding`, `/cash-carry`, `/top`, `/:id`, `/stats`

## Формулы
- `basisPercent = (futuresPrice - spotPrice) / spotPrice * 100`
- `netBasisPercent = basisPercent - feesPercent - slippagePercent`
- `netFundingPercent = fundingRate% - feesPercent - slippagePercent`
- `estimatedProfitUsd = positionSizeUsd * netPercent / 100`

## Зависимости
- `market-data` — MarketDataCacheService
- `jobs` — ArbitrageCalculateProcessor
- `mini-app-api` — dashboard через Funding/CashCarry services

## Что читать при изменениях
- `utils/arbitrage-math.util.ts`
- `services/arbitrage-calculation.service.ts`
- `services/net-yield-calculator.service.ts`
- `entities/arbitrage-opportunity.entity.ts`
