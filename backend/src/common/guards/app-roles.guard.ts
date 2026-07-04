import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppUserRole } from '../constants/app-role.constant';
import { APP_ROLES_KEY } from '../decorators/app-roles.decorator';

/** Guard проверки ролей. Если декоратор @AppRoles() не задан — доступ разрешён. */
@Injectable()
export class AppRolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<AppUserRole[]>(
            APP_ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user as { role?: string; id?: string } | undefined;

        if (!user) {
            throw new ForbiddenException('Требуется авторизация');
        }

        const role = user.role as AppUserRole | undefined;
        if (!role || !Object.values(AppUserRole).includes(role)) {
            this.throwForbiddenForMissingRole(requiredRoles);
        }

        const hasRole = requiredRoles.includes(role);
        if (!hasRole) {
            this.throwForbiddenForMissingRole(requiredRoles);
        }

        return true;
    }

    private throwForbiddenForMissingRole(requiredRoles: AppUserRole[]): never {
        throw new ForbiddenException(
            `Доступ запрещён. Требуется одна из ролей: ${requiredRoles.join(', ')}`,
        );
    }
}
