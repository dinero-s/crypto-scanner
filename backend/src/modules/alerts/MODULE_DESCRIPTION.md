# Alerts

## Назначение
Telegram-уведомления при превышении порогов net yield / funding / basis.

## Структура
- `services/` — evaluateAndDispatch, Telegram Bot API, BullMQ producer/processor
- `repositories/` — user_alert_settings, sent_alerts
- `entities/` — AlertSettingsEntity → `user_alert_settings`, AlertDeliveryEntity → `sent_alerts`
- `utils/` — fingerprint, формат сообщений
- `controllers/` — REST для Mini App (`/user/alerts/settings`)

## Mongo collections
- `user_alert_settings` — пороги пользователя
- `sent_alerts` — dedup по fingerprint + cooldown user/type/symbol

## Основные потоки
1. `ArbitrageCalculateProcessor` → `AlertQueueProducer.enqueueEvaluate()`
2. `AlertQueueProcessor` → `AlertsService.evaluateAndDispatch()`
3. Проверка порогов → dedup/cooldown → job dispatch → `TelegramNotificationService.sendMessage()`

## Fingerprint
`type|baseAsset|quoteAsset|spotExchange|futuresExchange|roundedNetYield|nextFundingTime`

## Подписка (MVP mock)
- Free: алерты только по топ-3 opportunities
- Premium/Trial: без ограничений (флаг в `telegram_users.subscriptionStatus`)

## Зависимости
- `arbitrage`, `telegram-users`
- Config: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_MINI_APP_URL`, `TELEGRAM_ALERTS_ENABLED`

## Что читать при изменениях
- `services/alerts.service.ts`
- `services/telegram-notification.service.ts`
- `utils/alert-fingerprint.util.ts`
