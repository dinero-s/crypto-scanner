# AdminUsers

## Назначение
Учётные записи администраторов: вход, CRUD, роли и смена пароля.

## Структура
- controllers: `admin-users.controller.ts` (админские эндпоинты `/admin-users`)
- services: `admin-users.service.ts`
- dtos: создание, вход, смена пароля, обновление роли и профиля
- entities: `admin-users.entity.ts`
- guards/enums: `roles.guard.ts`, `roles.enum.ts`

## Основные потоки
- Создание администратора, вход с JWT, список и детали.
- Обновление данных, смена роли, смена пароля, удаление.
- Действия логируются через `AuditLogService`.

## Зависимости
- `AuditLogModule`, `ConfigModule` (JWT-секреты).
- Роутинг: `RoutesAdminModule`.

## Что читать при изменениях
- `admin-users.module.ts`, `admin-users.controller.ts`, `admin-users.service.ts`, `roles.guard.ts`, dtos/entity.
