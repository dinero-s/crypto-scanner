/**
 * Маркер клиента мобильного/веб-приложения (JWT `/user/*`).
 * Роли сотрудников админки — `AdminRole` (MAIN_ADMIN, ADMIN, CONTENT_MANAGER), отдельный JWT `/admin/*`.
 */
export enum AppUserRole {
    /** Авторизованный пользователь */
    USER = 'user',
}

/** Префиксы маршрутов */
export const APP_CABINET_PATHS = {
    /** Публичная часть */
    PUBLIC: '/api',
    /** Пользовательский кабинет */
    USER: '/user',
    /** Админ-панель */
    ADMIN: '/admin',
} as const;
