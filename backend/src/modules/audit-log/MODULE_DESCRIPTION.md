# AuditLog

## Назначение
Журнал действий администраторов: запись событий и просмотр в админке.

## Структура
- controllers: `audit-log.admin.controller.ts` (список и детали)
- services: `audit-log.service.ts`
- interceptors: `admin-audit-log.interceptor.ts` (автологирование HTTP-запросов админов)
- dto: фильтры, создание, ответы таблицы и детали
- entities: `audit-log.entity.ts`
- enums: `audit-action`, `audit-category`, `audit-status`

## Основные потоки
- Interceptor перехватывает админские запросы и пишет запись в MongoDB.
- Сервисы (`AdminUsersService` и др.) вызывают `AuditLogService` напрямую.
- Админ просматривает журнал с фильтрацией и детализацией.

## Зависимости
- `UsersModule` (forwardRef, обогащение данных пользователя).
- Роутинг: `RoutesAdminModule`.

## Что читать при изменениях
- `audit-log.module.ts`, `audit-log.service.ts`, `admin-audit-log.interceptor.ts`, enums, dto/entity.
