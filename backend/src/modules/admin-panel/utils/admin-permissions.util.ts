import { AdminRole } from 'src/modules/admin-users/enums/roles.enum';

/** Супер-роли с полным доступом */
export function isSuperAdminRole(role: AdminRole): boolean {
    return role === AdminRole.MAIN_ADMIN || role === AdminRole.SUPER_ADMIN;
}

/** Может выполнять write-операции */
export function canAdminWrite(role: AdminRole): boolean {
    return role !== AdminRole.READONLY;
}

/** Может блокировать пользователей */
export function canAdminBlockUser(role: AdminRole): boolean {
    if (!canAdminWrite(role)) {
        return false;
    }
    return role !== AdminRole.COMPLIANCE;
}

/** Может менять роли пользователей платформы */
export function canAdminChangeUserRole(role: AdminRole): boolean {
    return isSuperAdminRole(role) || role === AdminRole.ADMIN;
}

/** Может управлять подключениями (sync, health, pause) */
export function canAdminManageConnections(role: AdminRole): boolean {
    if (!canAdminWrite(role)) {
        return false;
    }
    return role !== AdminRole.COMPLIANCE;
}

/** Может управлять jobs */
export function canAdminManageJobs(role: AdminRole): boolean {
    return canAdminManageConnections(role);
}

/** Может просматривать compliance logs */
export function canAdminViewCompliance(role: AdminRole): boolean {
    return true;
}
