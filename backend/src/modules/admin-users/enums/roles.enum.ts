/** Роли админ-панели SaaS */
export enum AdminRole {
    /** Главный админ (legacy): полный доступ */
    MAIN_ADMIN = 'main_admin',
    /** Администратор (legacy): операции без смены ролей MAIN_ADMIN */
    ADMIN = 'admin',
    /** Контент-менеджер (legacy) */
    CONTENT_MANAGER = 'content_manager',
    /** Супер-админ: полный доступ */
    SUPER_ADMIN = 'super_admin',
    /** Поддержка: пользователи, подключения, jobs, sync/health */
    SUPPORT = 'support',
    /** Compliance: audit и compliance logs */
    COMPLIANCE = 'compliance',
    /** Только просмотр */
    READONLY = 'readonly',
}

/** Все роли для read-эндпоинтов */
export const ADMIN_ROLES_ALL: AdminRole[] = [
    AdminRole.CONTENT_MANAGER,
    AdminRole.ADMIN,
    AdminRole.MAIN_ADMIN,
    AdminRole.SUPER_ADMIN,
    AdminRole.SUPPORT,
    AdminRole.COMPLIANCE,
    AdminRole.READONLY,
];

/** ADMIN и MAIN_ADMIN — финансы, экспорт (legacy) */
export const ADMIN_ROLES_FINANCE: AdminRole[] = [
    AdminRole.ADMIN,
    AdminRole.MAIN_ADMIN,
    AdminRole.SUPER_ADMIN,
];

/** Роли с правом записи (не READONLY) */
export const ADMIN_ROLES_WRITE: AdminRole[] = ADMIN_ROLES_ALL.filter(
    (role) => role !== AdminRole.READONLY,
);

/** Роли с полным доступом */
export const ADMIN_ROLES_SUPER: AdminRole[] = [
    AdminRole.MAIN_ADMIN,
    AdminRole.SUPER_ADMIN,
];
