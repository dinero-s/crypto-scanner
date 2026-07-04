import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { FilterAdminRecommendationsDto } from '../dto/admin-recommendation.dto';
import { AdminRecommendationsService } from '../services/admin-recommendations.service';

@ApiTags('Admin — Recommendations')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('recommendations')
export class AdminRecommendationsController {
    constructor(private readonly recommendationsService: AdminRecommendationsService) {}

    @Get()
    @ApiOperation({ summary: 'Список recommendations' })
    findAll(@Query() filter: FilterAdminRecommendationsDto) {
        return this.recommendationsService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детали recommendation' })
    findOne(@Param('id') id: string) {
        return this.recommendationsService.findOne(id);
    }
}
