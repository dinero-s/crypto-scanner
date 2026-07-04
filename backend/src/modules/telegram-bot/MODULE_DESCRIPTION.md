# Telegram Bot

## Назначение
Telegram Bot API: команды, webhook, long polling, кнопка Mini App.

## Структура
- `services/telegram-bot.service.ts` — /start, /settings, /status, /top
- `services/telegram-bot-polling.service.ts` — dev long polling
- `controllers/telegram-bot.controller.ts` — POST `/telegram/webhook`

## Команды
- `/start` — disclaimer + кнопка «Открыть Mini App»
- `/settings` — текущие пороги алертов
- `/status` — подписка, статус алертов
- `/top` — топ-3 opportunities

## Зависимости
- `telegram-users`, `alerts`, `arbitrage`
- Config: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_MINI_APP_URL`, `TELEGRAM_USE_POLLING`, `TELEGRAM_WEBHOOK_SECRET`

## Что читать при изменениях
- `services/telegram-bot.service.ts`
- `controllers/telegram-bot.controller.ts`
