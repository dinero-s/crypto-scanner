import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { FilterAdminComplianceLogsDto } from '../dto/admin-compliance.dto';
import { AdminComplianceService } from '../services/admin-compliance.service';

@ApiTags('Admin — Compliance Logs')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('compliance-logs')
export class AdminComplianceLogsController {
    constructor(private readonly complianceService: AdminComplianceService) {}

    @Get()
    @ApiOperation({ summary: 'Список compliance logs' })
    findAll(@Query() filter: FilterAdminComplianceLogsDto) {
        return this.complianceService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детали compliance log' })
    findOne(@Param('id') id: string) {
        return this.complianceService.findOne(id);
    }
}
