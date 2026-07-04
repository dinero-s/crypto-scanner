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
import { ProductAnalyticsService } from '../analytics/services/product-analytics.service';
import { AlertsService } from '../alerts/services/alerts.service';
import {
    ListAlertsQueryDto,
    ListProductsQueryDto,
    TestAlertDto,
    TriggerSyncDto,
} from '../dto/ozon-query.dto';
import { CreateOzonConnectionDto } from '../integration/dto/create-ozon-connection.dto';
import { OzonConnectionAuditService } from '../integration/services/ozon-connection-audit.service';
import { OzonConnectionService } from '../integration/services/ozon-connection.service';
import {
    OzonConnectionAuditAction,
    OzonConnectionAuditStatus,
} from '../constants/ozon.enums';
import { OzonAuditService } from '../analytics/services/ozon-audit.service';
import { OzonQueueProducerService } from '../queue/ozon-queue.producer.service';
import { SellerDataSyncService } from '../seller/services/seller-data-sync.service';

/** Ozon Marketplace Operator — только официальные API */
@ApiTags('Ozon Operator')
@ApiBearerAuth('accessToken')
@AppRoles(AppUserRole.USER)
@Controller('ozon')
export class OzonController {
    constructor(
        private readonly connectionService: OzonConnectionService,
        private readonly connectionAuditService: OzonConnectionAuditService,
        private readonly sellerDataSyncService: SellerDataSyncService,
        private readonly productAnalyticsService: ProductAnalyticsService,
        private readonly alertsService: AlertsService,
        private readonly auditService: OzonAuditService,
        private readonly ozonQueueProducer: OzonQueueProducerService,
    ) {}

    @Post('connections')
    @ApiOperation({ summary: 'Подключить Ozon API credentials' })
    @ApiResponse({ status: 201, description: 'Подключение создано' })
    async createConnection(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateOzonConnectionDto,
    ) {
        const connection = await this.connectionService.create(userId, dto);
        await this.auditService.scheduleInitialAuditWithSync(userId, connection.id);
        return connection;
    }

    @Get('connections')
    @ApiOperation({ summary: 'Список подключений Ozon' })
    async listConnections(@CurrentUser('id') userId: string) {
        return this.connectionService.findAllByUser(userId);
    }

    @Get('connections/:id/health')
    @ApiOperation({ summary: 'Проверить подключение Ozon' })
    async healthCheck(
        @CurrentUser('id') userId: string,
        @Param('id') connectionId: string,
    ) {
        return this.connectionService.healthCheck(userId, connectionId);
    }

    @Get('connections/:id/audit')
    @ApiOperation({ summary: 'Аудит действий с подключением Ozon' })
    async listConnectionAudit(
        @CurrentUser('id') userId: string,
        @Param('id') connectionId: string,
    ) {
        return this.connectionAuditService.listByUser(userId, connectionId);
    }

    @Delete('connections/:id')
    @ApiOperation({ summary: 'Отключить интеграцию Ozon' })
    async deleteConnection(
        @CurrentUser('id') userId: string,
        @Param('id') connectionId: string,
    ) {
        await this.connectionService.revoke(userId, connectionId);
        return { success: true };
    }

    @Post('connections/:id/sync')
    @ApiOperation({ summary: 'Запустить синхронизацию вручную' })
    async triggerSync(
        @CurrentUser('id') userId: string,
        @Param('id') connectionId: string,
        @Body() _dto: TriggerSyncDto,
    ) {
        await this.ozonQueueProducer.enqueueFullSync(connectionId, userId);
        await this.connectionAuditService.log({
            userId,
            connectionId,
            action: OzonConnectionAuditAction.SYNC_TRIGGERED,
            status: OzonConnectionAuditStatus.SUCCESS,
        });
        return { queued: true };
    }

    @Get('products')
    @ApiOperation({ summary: 'Список товаров продавца' })
    async listProducts(
        @CurrentUser('id') userId: string,
        @Query() query: ListProductsQueryDto,
    ) {
        return this.productAnalyticsService.listProducts(userId, query);
    }

    @Get('products/:id/analytics')
    @ApiOperation({ summary: 'Аналитика товара' })
    async productAnalytics(
        @CurrentUser('id') userId: string,
        @Param('id') productId: string,
    ) {
        return this.productAnalyticsService.getProductAnalytics(userId, productId);
    }

    @Get('alerts')
    @ApiOperation({ summary: 'Список уведомлений' })
    async listAlerts(
        @CurrentUser('id') userId: string,
        @Query() query: ListAlertsQueryDto,
    ) {
        return this.alertsService.listAlerts(userId, query.status);
    }

    @Post('alerts/test')
    @ApiOperation({ summary: 'Тестовое уведомление' })
    async testAlert(
        @CurrentUser('id') userId: string,
        @Body() dto: TestAlertDto,
    ) {
        return this.alertsService.sendTestAlert(
            userId,
            dto.type,
            dto.severity,
            dto.message,
            dto.connectionId,
        );
    }
}
