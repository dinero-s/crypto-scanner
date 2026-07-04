/** Типы действий для аудита */
export enum AuditAction {
    CREATE = 'create',       // Создание
    UPDATE = 'update',       // Обновление
    DELETE = 'delete',       // Удаление
    LOGIN = 'login',         // Вход в систему
    LOGOUT = 'logout',       // Выход из системы
    APPROVE = 'approve',      // Одобрение
    REJECT = 'reject',       // Отклонение
    ACTIVATE = 'activate',   // Активация
    DEACTIVATE = 'deactivate', // Деактивация
    BLOCK = 'block',         // Блокировка (санкция)
    UNBLOCK = 'unblock',     // Разблокировка
    DISABLE = 'disable',     // Отключение (подписка истекла)
    ENABLE = 'enable',       // Включение
    ADMIN_VIEWED_USER = 'admin_viewed_user',
    ADMIN_BLOCKED_USER = 'admin_blocked_user',
    ADMIN_UNBLOCKED_USER = 'admin_unblocked_user',
    ADMIN_CHANGED_USER_ROLE = 'admin_changed_user_role',
    ADMIN_VIEWED_CONNECTION = 'admin_viewed_connection',
    ADMIN_STARTED_CONNECTION_SYNC = 'admin_started_connection_sync',
    ADMIN_RAN_HEALTH_CHECK = 'admin_ran_health_check',
    ADMIN_PAUSED_CONNECTION = 'admin_paused_connection',
    ADMIN_RESUMED_CONNECTION = 'admin_resumed_connection',
    ADMIN_SOFT_DELETED_CONNECTION = 'admin_soft_deleted_connection',
    ADMIN_RETRIED_JOB = 'admin_retried_job',
    ADMIN_CANCELLED_JOB = 'admin_cancelled_job',
}
