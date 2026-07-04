import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { FilterAdminAlertsDto } from '../dto/admin-alert.dto';
import { AdminAlertsService } from '../services/admin-alerts.service';

@ApiTags('Admin — Alerts')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('alerts')
export class AdminAlertsController {
    constructor(private readonly alertsService: AdminAlertsService) {}

    @Get()
    @ApiOperation({ summary: 'Список alerts' })
    findAll(@Query() filter: FilterAdminAlertsDto) {
        return this.alertsService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детали alert' })
    findOne(@Param('id') id: string) {
        return this.alertsService.findOne(id);
    }
}
