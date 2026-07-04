# Alerts

## Назначение
Telegram-уведомления при превышении порогов net yield / funding / basis.

## Структура
- `services/` — бизнес-логика, Telegram Bot API, BullMQ producer/processor
- `repositories/` — настройки и история доставки
- `entities/` — alert_settings, alert_deliveries
- `controllers/` — REST для Mini App

## Основные потоки
- После пересчёта arbitrage → `AlertsService.evaluateAndDispatch()`
- Job в очереди `scanner-alerts` → `TelegramNotificationService.sendMessage()`

## Зависимости
- `arbitrage` — opportunities для проверки порогов
- `telegram-users` — chat ID пользователя
- Config: `TELEGRAM_BOT_TOKEN`

## Что читать при изменениях
- `services/alerts.service.ts`
- `services/telegram-notification.service.ts`
- `dto/alert-settings.dto.ts`
