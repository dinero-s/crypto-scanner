# Arbitrage

## Назначение
Расчёт арбитражных возможностей: Funding Rate и Cash & Carry (Spot-Futures basis) с net yield.

## Структура
- `services/` — funding arb, cash & carry, net yield calculator
- `repositories/` — хранение рассчитанных opportunities
- `entities/` — MongoDB-схема
- `interfaces/` — типы возможностей

## Основные потоки
- После сбора market data → пересчёт opportunities
- Net yield = gross − fees − spread − slippage
- API отдаёт отфильтрованный список через `mini-app-api`

## Зависимости
- `market-data` — исходные цены и funding
- `jobs` — периодический пересчёт
- `alerts` — уведомления при превышении порога

## Что читать при изменениях
- `services/net-yield-calculator.service.ts`
- `services/funding-arbitrage.service.ts`
- `services/cash-carry-arbitrage.service.ts`
