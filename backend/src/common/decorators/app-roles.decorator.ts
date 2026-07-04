import { SetMetadata } from '@nestjs/common';
import { AppUserRole } from '../constants/app-role.constant';

/** Ключ метаданных для проверки ролей пользователя */
export const APP_ROLES_KEY = 'app_roles';

/** Декоратор: разрешить доступ только указанным ролям */
export const AppRoles = (...roles: AppUserRole[]) =>
    SetMetadata(APP_ROLES_KEY, roles);
