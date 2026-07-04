import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AppRoles } from 'src/common/decorators/app-roles.decorator';
import { AppUserRole } from 'src/common/constants/app-role.constant';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { OzonAuditService } from '../analytics/services/ozon-audit.service';
import {
    LatestAuditQueryDto,
    ListAuditRecommendationsQueryDto,
    ListIssuesQueryDto,
    RunAuditDto,
    UpdateAuditRecommendationStatusDto,
    UpdateIssueStatusDto,
} from '../analytics/dto/ozon-audit.dto';

/** Profit Audit Ozon — детерминированный аудит + AI-объяснение */
@ApiTags('Ozon Profit Audit')
@ApiBearerAuth('accessToken')
@AppRoles(AppUserRole.USER)
@Controller('ozon')
export class OzonAuditController {
    constructor(private readonly auditService: OzonAuditService) {}

    @Post('audit/run')
    @ApiOperation({ summary: 'Запустить Profit Audit вручную' })
    @ApiResponse({ status: 201, description: 'Аудит поставлен в очередь' })
    async runAudit(
        @CurrentUser('id') userId: string,
        @Body() dto: RunAuditDto,
    ) {
        return this.auditService.runAuditAsync(
            userId,
            dto.connectionId,
            dto.periodDays ?? 30,
        );
    }

    @Get('audit/status')
    @ApiOperation({ summary: 'Состояние Profit Audit для UI' })
    async auditStatus(
        @CurrentUser('id') userId: string,
        @Query() query: LatestAuditQueryDto,
    ) {
        return this.auditService.getAuditStatus(userId, query.connectionId);
    }

    @Get('audit/latest')
    @ApiOperation({ summary: 'Последний AI-отчёт аудита' })
    @ApiResponse({ status: 200, description: 'Отчёт найден' })
    async latestAudit(
        @CurrentUser('id') userId: string,
        @Query() query: LatestAuditQueryDto,
    ) {
        return this.auditService.getLatestReport(userId, query.connectionId);
    }

    @Get('issues')
    @ApiOperation({ summary: 'Список обнаруженных проблем' })
    async listIssues(
        @CurrentUser('id') userId: string,
        @Query() query: ListIssuesQueryDto,
    ) {
        return this.auditService.listIssues(userId, query);
    }

    @Get('issues/:id')
    @ApiOperation({ summary: 'Детальная информация о проблеме' })
    async getIssue(
        @CurrentUser('id') userId: string,
        @Param('id') issueId: string,
    ) {
        return this.auditService.getIssue(userId, issueId);
    }

    @Patch('issues/:id/status')
    @ApiOperation({ summary: 'Обновить статус проблемы' })
    async updateIssueStatus(
        @CurrentUser('id') userId: string,
        @Param('id') issueId: string,
        @Body() dto: UpdateIssueStatusDto,
    ) {
        const issue = await this.auditService.updateIssueStatus(
            userId,
            issueId,
            dto.status,
        );
        return { issue };
    }

    @Get('audit/recommendations')
    @ApiOperation({ summary: 'Список рекомендаций Profit Audit' })
    async listRecommendations(
        @CurrentUser('id') userId: string,
        @Query() query: ListAuditRecommendationsQueryDto,
    ) {
        return this.auditService.listAuditRecommendations(
            userId,
            query.connectionId,
            query.status,
            query.activeOnly,
        );
    }

    @Patch('audit/recommendations/:id/status')
    @ApiOperation({ summary: 'Обновить статус рекомендации Profit Audit' })
    async updateRecommendationStatus(
        @CurrentUser('id') userId: string,
        @Param('id') recommendationId: string,
        @Body() dto: UpdateAuditRecommendationStatusDto,
    ) {
        const recommendation = await this.auditService.updateRecommendationStatus(
            userId,
            recommendationId,
            dto.status,
        );
        return { recommendation };
    }
}
