import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { AdminFeatureFlagsResponseDto } from '../dto/admin-feature-flags.dto';
import { AdminFeatureFlagsService } from '../services/admin-feature-flags.service';

@ApiTags('Admin — Feature Flags')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('feature-flags')
export class AdminFeatureFlagsController {
    constructor(private readonly featureFlagsService: AdminFeatureFlagsService) {}

    @Get()
    @ApiOperation({ summary: 'Feature flags (read-only)' })
    @ApiResponse({ status: 200, type: AdminFeatureFlagsResponseDto })
    getFeatureFlags(): AdminFeatureFlagsResponseDto {
        return this.featureFlagsService.getFeatureFlags();
    }
}
