import { SetMetadata } from '@nestjs/common';

export enum AdminWriteAction {
    BLOCK_USER = 'block_user',
    UNBLOCK_USER = 'unblock_user',
    CHANGE_USER_ROLE = 'change_user_role',
    MANAGE_CONNECTION = 'manage_connection',
    DELETE_CONNECTION = 'delete_connection',
    MANAGE_JOB = 'manage_job',
}

export const ADMIN_WRITE_ACTION_KEY = 'adminWriteAction';

/** Маркер write-операции для AdminWriteGuard */
export const AdminWrite = (action: AdminWriteAction): MethodDecorator =>
    SetMetadata(ADMIN_WRITE_ACTION_KEY, action);
