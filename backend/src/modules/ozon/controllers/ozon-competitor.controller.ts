import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
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
import {
    CreateCompetitorProductDto,
    ListCompetitorSnapshotsQueryDto,
    SyncAllCompetitorsDto,
} from '../competitor/dto/create-competitor-product.dto';
import { CompetitorTrackingService } from '../competitor/services/competitor-tracking.service';
import { OzonQueueProducerService } from '../queue/ozon-queue.producer.service';

/** Мониторинг карточек конкурентов Ozon */
@ApiTags('Ozon Competitors')
@ApiBearerAuth('accessToken')
@AppRoles(AppUserRole.USER)
@Controller('ozon/competitors')
export class OzonCompetitorController {
    constructor(
        private readonly competitorTrackingService: CompetitorTrackingService,
        private readonly ozonQueueProducer: OzonQueueProducerService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Добавить карточку конкурента по URL Ozon' })
    @ApiResponse({ status: 201, description: 'Карточка добавлена' })
    async addCompetitor(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateCompetitorProductDto,
    ) {
        return this.competitorTrackingService.addCompetitor(userId, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Список отслеживаемых карточек конкурентов' })
    async listCompetitors(@CurrentUser('id') userId: string) {
        return this.competitorTrackingService.listCompetitors(userId);
    }

    @Post('sync')
    @ApiOperation({ summary: 'Синхронизировать все карточки конкурентов' })
    async syncAll(
        @CurrentUser('id') userId: string,
        @Body() dto: SyncAllCompetitorsDto,
    ) {
        return this.competitorTrackingService.queueSyncAll(userId, dto.connectionId);
    }

    @Get(':id/snapshots')
    @ApiOperation({ summary: 'История снимков карточки конкурента' })
    async listSnapshots(
        @CurrentUser('id') userId: string,
        @Param('id') competitorId: string,
        @Query() query: ListCompetitorSnapshotsQueryDto,
    ) {
        const items = await this.competitorTrackingService.listSnapshots(
            userId,
            competitorId,
            query.limit ?? 30,
        );
        return { items };
    }

    @Post(':id/sync')
    @ApiOperation({ summary: 'Синхронизировать карточку конкурента' })
    async syncOne(
        @CurrentUser('id') userId: string,
        @Param('id') competitorId: string,
    ) {
        await this.ozonQueueProducer.enqueueCompetitorSync(competitorId, userId);
        return { queued: true };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детальная карточка конкурента' })
    async getCompetitor(
        @CurrentUser('id') userId: string,
        @Param('id') competitorId: string,
    ) {
        return this.competitorTrackingService.getCompetitor(userId, competitorId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Убрать карточку из мониторинга' })
    async removeCompetitor(
        @CurrentUser('id') userId: string,
        @Param('id') competitorId: string,
    ) {
        await this.competitorTrackingService.removeCompetitor(userId, competitorId);
        return { success: true };
    }
}
