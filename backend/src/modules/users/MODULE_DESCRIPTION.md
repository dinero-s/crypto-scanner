# Users

## Назначение
Управление пользователями приложения: регистрация, аутентификация, профиль, админские операции.

## Структура
- controllers: `users.public.controller.ts` (публичные), `users.user.controller.ts` (личный кабинет), `users.admin.controller.ts` (админка)
- services: фасад `users.service.ts` + `users-auth`, `users-profile`, `users-management`, `users-export`, `users-activity`, `users-repository`, `oauth-verification`
- dtos: `auth.dto.ts`, профиль, пароль, блокировка, уведомления
- entities: `users.entity.ts`

## Основные потоки
- Регистрация, подтверждение email, вход (email/код/Google/Apple), refresh token, сброс пароля.
- Профиль и настройки уведомлений авторизованного пользователя.
- Админ: список, экспорт CSV, блокировка/разблокировка, CRUD.

## Зависимости
- `AdminUsersModule` (схема админов в провайдерах), `AuditLogModule`, `StorageModule` (аватар).
- Роутинг: `RoutesPublicModule`, `RoutesUserModule`, `RoutesAdminModule`.

## Что читать при изменениях
- `users.module.ts`, нужный controller, `users.service.ts` и целевой подсервис, соответствующий dto/entity.
