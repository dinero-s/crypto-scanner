import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../enums/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            throw new ForbiddenException('Пользователь не авторизован');
        }

        if (!user.role) {
            throw new ForbiddenException('У пользователя отсутствует роль');
        }

        /** SUPER_ADMIN / MAIN_ADMIN — полный доступ */
        const isSuperAdmin =
            user.role === AdminRole.MAIN_ADMIN ||
            user.role === AdminRole.SUPER_ADMIN;
        const hasRequiredRole = requiredRoles.some((role) => user.role === role);
        const hasRole = hasRequiredRole || isSuperAdmin;

        if (!hasRole) {
            throw new ForbiddenException(
                `Доступ запрещен. Требуется одна из ролей: ${requiredRoles.join(', ')}`,
            );
        }

        return true;
    }
} 