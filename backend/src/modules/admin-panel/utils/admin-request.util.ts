import { Request } from 'express';
import { AdminRole } from 'src/modules/admin-users/enums/roles.enum';
import { AdminAuditContext } from '../services/admin-audit-writer.service';

type AdminRequest = Request & {
    user?: {
        _id?: { toString(): string };
        id?: string;
        email?: string;
        role?: AdminRole;
    };
};

/** Извлекает контекст admin audit из request */
export function getAdminAuditContext(request: Request): AdminAuditContext {
    const user = (request as AdminRequest).user;

    return {
        adminId: user?._id?.toString?.() ?? user?.id ?? '',
        adminEmail: user?.email,
        adminRole: user?.role,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
    };
}
