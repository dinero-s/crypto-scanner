import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from 'src/modules/admin-users/enums/roles.enum';
import {
    ADMIN_WRITE_ACTION_KEY,
    AdminWriteAction,
} from '../decorators/admin-write.decorator';
import {
    canAdminBlockUser,
    canAdminChangeUserRole,
    canAdminManageConnections,
    canAdminManageJobs,
    canAdminWrite,
} from '../utils/admin-permissions.util';

/** Проверка прав на write-операции admin API */
@Injectable()
export class AdminWriteGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const action = this.reflector.getAllAndOverride<AdminWriteAction | undefined>(
            ADMIN_WRITE_ACTION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!action) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{ user?: { role?: AdminRole } }>();
        const role = request.user?.role;

        if (!role) {
            throw new ForbiddenException('Пользователь не авторизован');
        }

        if (!canAdminWrite(role)) {
            throw new ForbiddenException('Роль READONLY не может выполнять изменения');
        }

        const allowed = this.isActionAllowed(role, action);
        if (!allowed) {
            throw new ForbiddenException('Недостаточно прав для выполнения действия');
        }

        return true;
    }

    private isActionAllowed(role: AdminRole, action: AdminWriteAction): boolean {
        switch (action) {
            case AdminWriteAction.BLOCK_USER:
            case AdminWriteAction.UNBLOCK_USER:
                return canAdminBlockUser(role);
            case AdminWriteAction.CHANGE_USER_ROLE:
                return canAdminChangeUserRole(role);
            case AdminWriteAction.MANAGE_CONNECTION:
            case AdminWriteAction.DELETE_CONNECTION:
                return canAdminManageConnections(role);
            case AdminWriteAction.MANAGE_JOB:
                return canAdminManageJobs(role);
            default:
                return canAdminWrite(role);
        }
    }
}
