import { Injectable } from '@nestjs/common';
import { AuditLogService } from 'src/modules/audit-log/services/audit-log.service';
import { AuditAction } from 'src/modules/audit-log/enums/audit-action.enum';
import { AuditCategory } from 'src/modules/audit-log/enums/audit-category.enum';
import { AuditStatus } from 'src/modules/audit-log/enums/audit-status.enum';
import { AdminRole } from 'src/modules/admin-users/enums/roles.enum';

export interface AdminAuditContext {
    adminId: string;
    adminEmail?: string;
    adminRole?: AdminRole;
    ip?: string;
    userAgent?: string;
}

/** Запись admin audit actions по спецификации */
@Injectable()
export class AdminAuditWriterService {
    constructor(private readonly auditLogService: AuditLogService) {}

    async log(
        ctx: AdminAuditContext,
        action: AuditAction,
        entity: string,
        entityId: string,
        summary: string,
        status: AuditStatus = AuditStatus.SUCCESS,
    ): Promise<void> {
        await this.auditLogService.create({
            adminId: ctx.adminId,
            action,
            entity,
            entityId,
            category: AuditCategory.ADMIN_SETTINGS,
            summary,
            description: summary,
            status,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
        });
    }
}
