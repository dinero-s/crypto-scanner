import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { OZON_QUEUE_NAMES, QUEUE_NAMES, DEFAULT_QUEUE_JOB_OPTIONS } from 'src/common/queue/constants/queue.constant';
import { AdminUsersModule } from 'src/modules/admin-users/admin-users.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { UsersModule } from 'src/modules/users/users.module';
import { OzonModule } from 'src/modules/ozon/ozon.module';
import { AdminUsersEntity, AdminUsersSchema } from 'src/modules/admin-users/entities/admin-users.entity';
import { AuditLogEntity, AuditLogSchema } from 'src/modules/audit-log/entities/audit-log.entity';
import { AlertEventEntity, AlertEventSchema } from 'src/modules/ozon/alerts/entities/alert-event.entity';
import {
    RecommendationEntity,
    RecommendationSchema,
} from 'src/modules/ozon/analytics/entities/recommendation.entity';
import {
    CompetitorProductEntity,
    CompetitorProductSchema,
} from 'src/modules/ozon/competitor/entities/competitor-product.entity';
import {
    OzonConnectionAuditEntity,
    OzonConnectionAuditSchema,
} from 'src/modules/ozon/integration/entities/ozon-connection-audit.entity';
import {
    OzonConnectionEntity,
    OzonConnectionSchema,
} from 'src/modules/ozon/integration/entities/ozon-connection.entity';
import {
    SellerProductEntity,
    SellerProductSchema,
} from 'src/modules/ozon/seller/entities/seller-product.entity';
import { ComplianceLogEntity, ComplianceLogSchema } from './entities/compliance-log.entity';
import { AdminWriteGuard } from './guards/admin-write.guard';
import { AdminOverviewService } from './services/admin-overview.service';
import { AdminUsersPanelService } from './services/admin-users-panel.service';
import { AdminConnectionsService } from './services/admin-connections.service';
import { AdminJobsService } from './services/admin-jobs.service';
import { AdminComplianceService } from './services/admin-compliance.service';
import { AdminAuditLogsService } from './services/admin-audit-logs.service';
import { AdminAlertsService } from './services/admin-alerts.service';
import { AdminRecommendationsService } from './services/admin-recommendations.service';
import { AdminHealthService } from './services/admin-health.service';
import { AdminFeatureFlagsService } from './services/admin-feature-flags.service';
import { AdminAuditWriterService } from './services/admin-audit-writer.service';

/** Admin Panel SaaS — marketplace operator diagnostics */
@Module({
    imports: [
        UsersModule,
        AdminUsersModule,
        AuditLogModule,
        OzonModule,
        BullModule.registerQueue({
            name: QUEUE_NAMES.OZON_SYNC,
            defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
        }),
        BullModule.registerQueue({
            name: QUEUE_NAMES.OZON_AUDIT,
            defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
        }),
        BullModule.registerQueue({
            name: QUEUE_NAMES.OZON_COMPETITOR,
            defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
        }),
        MongooseModule.forFeature(
            [
                { name: ComplianceLogEntity.name, schema: ComplianceLogSchema },
                { name: AdminUsersEntity.name, schema: AdminUsersSchema },
                { name: AuditLogEntity.name, schema: AuditLogSchema },
                { name: OzonConnectionEntity.name, schema: OzonConnectionSchema },
                { name: OzonConnectionAuditEntity.name, schema: OzonConnectionAuditSchema },
                { name: AlertEventEntity.name, schema: AlertEventSchema },
                { name: RecommendationEntity.name, schema: RecommendationSchema },
                { name: SellerProductEntity.name, schema: SellerProductSchema },
                { name: CompetitorProductEntity.name, schema: CompetitorProductSchema },
            ],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    controllers: [],
    providers: [
        AdminWriteGuard,
        AdminOverviewService,
        AdminUsersPanelService,
        AdminConnectionsService,
        AdminJobsService,
        AdminComplianceService,
        AdminAuditLogsService,
        AdminAlertsService,
        AdminRecommendationsService,
        AdminHealthService,
        AdminFeatureFlagsService,
        AdminAuditWriterService,
    ],
    exports: [
        AdminWriteGuard,
        AdminOverviewService,
        AdminUsersPanelService,
        AdminConnectionsService,
        AdminJobsService,
        AdminComplianceService,
        AdminAuditLogsService,
        AdminAlertsService,
        AdminRecommendationsService,
        AdminHealthService,
        AdminFeatureFlagsService,
        AdminAuditWriterService,
    ],
})
export class AdminPanelModule {}
