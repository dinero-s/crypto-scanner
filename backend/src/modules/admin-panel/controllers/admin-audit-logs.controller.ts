import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { FilterAdminAuditLogsDto } from '../dto/admin-audit.dto';
import { AdminAuditLogsService } from '../services/admin-audit-logs.service';

@ApiTags('Admin — Audit Logs')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('audit-logs')
export class AdminAuditLogsController {
    constructor(private readonly auditLogsService: AdminAuditLogsService) {}

    @Get()
    @ApiOperation({ summary: 'Список audit logs' })
    findAll(@Query() filter: FilterAdminAuditLogsDto) {
        return this.auditLogsService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детали audit log' })
    findOne(@Param('id') id: string) {
        return this.auditLogsService.findOne(id);
    }
}
