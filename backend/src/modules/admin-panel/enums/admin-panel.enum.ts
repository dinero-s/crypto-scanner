/** Решение compliance-слоя */
export enum ComplianceDecision {
    ALLOWED = 'ALLOWED',
    BLOCKED = 'BLOCKED',
    SKIPPED = 'SKIPPED',
    UNKNOWN = 'UNKNOWN',
}

/** Тип маркетплейса */
export enum MarketplaceType {
    OZON = 'OZON',
    WILDBERRIES = 'WILDBERRIES',
}

/** Статус health-сервиса */
export enum HealthServiceStatus {
    OK = 'OK',
    DEGRADED = 'DEGRADED',
    DOWN = 'DOWN',
    UNKNOWN = 'UNKNOWN',
}

/** Статус BullMQ job для admin UI */
export enum AdminJobStatus {
    WAITING = 'WAITING',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    RETRYING = 'RETRYING',
    DELAYED = 'DELAYED',
    CANCELLED = 'CANCELLED',
}

/** Канал алерта */
export enum AdminAlertChannel {
    EMAIL = 'EMAIL',
    TELEGRAM = 'TELEGRAM',
}

/** Health подключения для admin UI */
export enum ConnectionHealthStatus {
    OK = 'OK',
    FAILED = 'FAILED',
    UNKNOWN = 'UNKNOWN',
    PAUSED = 'PAUSED',
}

/** Статус пользователя для admin UI */
export enum AdminUserStatus {
    ACTIVE = 'ACTIVE',
    BLOCKED = 'BLOCKED',
    DISABLED = 'DISABLED',
    DELETED = 'DELETED',
}

/** Статус доступности данных рекомендации */
export enum AvailabilityStatus {
    AVAILABLE = 'AVAILABLE',
    PARTIAL = 'PARTIAL',
    NOT_AVAILABLE_VIA_OFFICIAL_API = 'NOT_AVAILABLE_VIA_OFFICIAL_API',
    API_ERROR = 'API_ERROR',
    PENDING = 'PENDING',
}
