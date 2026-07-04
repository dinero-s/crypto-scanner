# Exchanges

## Назначение
Единый слой интеграции с биржами: public market data connectors, нормализация символов. Только read-only API — без торговых операций и API keys.

## Структура
- `enums/` — биржи и типы рынков
- `interfaces/` — `ExchangeMarketDataConnector`, нормализованные модели
- `adapters/` — connectors Binance, Bybit, OKX, Gate, KuCoin, Kraken
- `services/` — HTTP-клиент, rate limiter, реестр, оркестратор partial results
- `errors/` — `ExchangeApiError`

## Основные потоки
- `ExchangeRegistryService` отдаёт connector по `ExchangeEnum`
- `ExchangeConnectorService` агрегирует данные со всех бирж с partial results
- `SymbolNormalizerService` переводит символы между unified (BTC/USDT) и native форматами
- Каждый connector: retry, timeout, rate limit, без падения приложения при ошибке одной биржи

## Зависимости
- ConfigModule (`exchanges.*` URLs, timeout, retry)
- HttpModule (@nestjs/axios)
- Используется в `market-data`, `arbitrage`

## Что читать при изменениях
- `interfaces/exchange-market-data-connector.interface.ts`
- `adapters/base-exchange.connector.ts`
- `services/exchange-http.service.ts`
- `services/exchange-registry.service.ts`
- `adapters/{exchange}/{exchange}.connector.ts`
