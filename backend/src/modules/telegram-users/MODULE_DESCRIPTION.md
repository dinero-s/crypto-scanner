# Telegram Users

## Назначение
Пользователи Telegram Mini App: авторизация через initData, профиль, mock-подписка (free).

## Структура
- `entities/` — telegram_users
- `repositories/` — CRUD
- `services/` — auth, profile, subscription
- `controllers/` — REST

## Основные потоки
- Mini App → initData → upsert пользователя
- Subscription пока всегда `free` (mock)

## Зависимости
- Config: `TELEGRAM_BOT_TOKEN`
- `alerts` — chatId для уведомлений

## Что читать при изменениях
- `services/telegram-users.service.ts`
- `entities/telegram-user.entity.ts`
