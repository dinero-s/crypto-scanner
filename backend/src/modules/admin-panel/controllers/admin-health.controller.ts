import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { AdminHealthResponseDto } from '../dto/admin-health.dto';
import { AdminHealthService } from '../services/admin-health.service';

@ApiTags('Admin — Health')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('health')
export class AdminHealthController {
    constructor(private readonly healthService: AdminHealthService) {}

    @Get()
    @ApiOperation({ summary: 'System health для admin panel' })
    @ApiResponse({ status: 200, type: AdminHealthResponseDto })
    getHealth(): Promise<AdminHealthResponseDto> {
        return this.healthService.getHealth();
    }
}
