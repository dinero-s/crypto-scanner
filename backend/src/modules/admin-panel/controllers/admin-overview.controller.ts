import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { AdminOverviewResponseDto } from '../dto/admin-overview-response.dto';
import { AdminOverviewService } from '../services/admin-overview.service';

@ApiTags('Admin — Overview')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('overview')
export class AdminOverviewController {
    constructor(private readonly overviewService: AdminOverviewService) {}

    @Get()
    @ApiOperation({ summary: 'Сводка admin panel' })
    @ApiResponse({ status: 200, type: AdminOverviewResponseDto })
    getOverview(): Promise<AdminOverviewResponseDto> {
        return this.overviewService.getOverview();
    }
}
