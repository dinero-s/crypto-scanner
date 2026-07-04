# Telegram Users

## Назначение
Пользователи Telegram Mini App и бота: upsert при /start, mock-подписка.

## Структура
- `entities/` — `telegram_users`
- `repositories/` — CRUD
- `services/` — auth, profile, subscription
- `controllers/` — REST

## Основные потоки
- Bot /start или Mini App → upsert пользователя
- `subscriptionStatus`: free (default), premium/trial — вручную в БД

## Зависимости
- Config: `TELEGRAM_BOT_TOKEN`
- `alerts` — chatId и настройки алертов

## Что читать при изменениях
- `services/telegram-users.service.ts`
- `entities/telegram-user.entity.ts`
