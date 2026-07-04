# AdminPanel

## Назначение
Внутренняя admin panel SaaS: overview, users, connections, jobs, compliance, audit, alerts, recommendations, health, feature flags.

## Структура
- controllers: REST `/api/admin/*`
- services: read-heavy diagnostics + guarded write actions
- dto: Swagger контракты на русском
- guards: AdminWriteGuard + RolesGuard

## Основные потоки
- Admin JWT (`type: admin`) + role guard
- Write actions → AdminAuditWriterService
- Compliance logs persist в MongoDB

## Зависимости
- OzonModule, UsersModule, AuditLogModule, BullMQ

## Что читать при изменениях
- `admin-panel.module.ts`
- `services/admin-connections.service.ts`
- `guards/admin-write.guard.ts`
