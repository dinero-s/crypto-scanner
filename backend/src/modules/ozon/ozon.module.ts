import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { UsersModule } from 'src/modules/users/users.module';
import {
    ComplianceLogEntity,
    ComplianceLogSchema,
} from 'src/modules/admin-panel/entities/compliance-log.entity';
import { OzonApiClientModule } from './clients/ozon-api-client.module';
import { LlmAdvisorProvider } from './ai-advisor/services/llm-advisor.provider';
import { OzonAiAdvisorService } from './ai-advisor/services/ozon-ai-advisor.service';
import { OzonAiContextBuilderService } from './ai-advisor/services/ozon-ai-context-builder.service';
import { AlertsService } from './alerts/services/alerts.service';
import { TelegramAlertService } from './alerts/services/telegram-alert.service';
import { AlertEventEntity, AlertEventSchema } from './alerts/entities/alert-event.entity';
import { OzonAuditDataQualityService } from './analytics/services/ozon-audit-data-quality.service';
import { OzonAuditRunService } from './analytics/services/ozon-audit-run.service';
import { OzonAuditService } from './analytics/services/ozon-audit.service';
import { ProductAnalyticsService } from './analytics/services/product-analytics.service';
import {
    ProductAnalyticsSnapshotEntity,
    ProductAnalyticsSnapshotSchema,
} from './analytics/entities/product-analytics-snapshot.entity';
import {
    OzonMetricSnapshotEntity,
    OzonMetricSnapshotSchema,
} from './analytics/entities/ozon-metric-snapshot.entity';
import {
    OzonDetectedIssueEntity,
    OzonDetectedIssueSchema,
} from './analytics/entities/ozon-detected-issue.entity';
import {
    OzonAuditRecommendationEntity,
    OzonAuditRecommendationSchema,
} from './analytics/entities/ozon-audit-recommendation.entity';
import {
    OzonAuditRunEntity,
    OzonAuditRunSchema,
} from './analytics/entities/ozon-audit-run.entity';
import {
    OzonAiReportEntity,
    OzonAiReportSchema,
} from './analytics/entities/ozon-ai-report.entity';
import { AdsWasteDetector } from './analytics/detectors/ads-waste.detector';
import { OverstockDetector } from './analytics/detectors/overstock.detector';
import { OzonIssueDetectorService } from './analytics/detectors/ozon-issue-detector.service';
import { PriceLeakDetector } from './analytics/detectors/price-leak.detector';
import { ReturnSpikeDetector } from './analytics/detectors/return-spike.detector';
import { StockoutRiskDetector } from './analytics/detectors/stockout-risk.detector';
import { OzonMetricsBuilderService } from './analytics/metrics/ozon-metrics-builder.service';
import { OzonRecommendationBuilderService } from './analytics/recommendations/ozon-recommendation-builder.service';
import { CompetitorTrackingService } from './competitor/services/competitor-tracking.service';
import { OfficialOzonCompetitorDataProvider } from './competitor/providers/official-ozon-competitor-data.provider';
import {
    CompetitorAnalyticsSnapshotEntity,
    CompetitorAnalyticsSnapshotSchema,
} from './competitor/entities/competitor-analytics-snapshot.entity';
import {
    CompetitorProductEntity,
    CompetitorProductSchema,
} from './competitor/entities/competitor-product.entity';
import {
    OzonConnectionAuditEntity,
    OzonConnectionAuditSchema,
} from './integration/entities/ozon-connection-audit.entity';
import {
    OzonConnectionEntity,
    OzonConnectionSchema,
} from './integration/entities/ozon-connection.entity';
import { OzonConnectionAuditService } from './integration/services/ozon-connection-audit.service';
import { OzonConnectionService } from './integration/services/ozon-connection.service';
import { OzonCredentialsCryptoService } from './integration/services/ozon-credentials-crypto.service';
import { OzonQueueProducerService } from './queue/ozon-queue.producer.service';
import { OzonAuditProcessor } from './queue/ozon-audit.processor';
import { OzonCompetitorProcessor } from './queue/ozon-competitor.processor';
import { OzonSyncProcessor } from './queue/ozon-sync.processor';
import { AlertDispatchProcessor } from './alerts/queue/alert-dispatch.processor';
import { AlertQueueProducerService } from './alerts/queue/alert-queue.producer.service';
import { SellerDataSyncService } from './seller/services/seller-data-sync.service';
import {
    OzonSellerReportEntity,
    OzonSellerReportSchema,
} from './seller/entities/ozon-seller-report.entity';
import {
    SellerProductEntity,
    SellerProductSchema,
} from './seller/entities/seller-product.entity';

/** MVP-модуль Ozon Marketplace Operator (legal-by-design) */
@Module({
    imports: [
        OzonApiClientModule,
        UsersModule,
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
        BullModule.registerQueue({
            name: QUEUE_NAMES.OZON_ALERTS,
            defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
        }),
        MongooseModule.forFeature(
            [
                { name: OzonConnectionEntity.name, schema: OzonConnectionSchema },
                { name: OzonConnectionAuditEntity.name, schema: OzonConnectionAuditSchema },
                { name: SellerProductEntity.name, schema: SellerProductSchema },
                { name: OzonSellerReportEntity.name, schema: OzonSellerReportSchema },
                { name: CompetitorProductEntity.name, schema: CompetitorProductSchema },
                {
                    name: CompetitorAnalyticsSnapshotEntity.name,
                    schema: CompetitorAnalyticsSnapshotSchema,
                },
                {
                    name: ProductAnalyticsSnapshotEntity.name,
                    schema: ProductAnalyticsSnapshotSchema,
                },
                { name: OzonMetricSnapshotEntity.name, schema: OzonMetricSnapshotSchema },
                { name: OzonDetectedIssueEntity.name, schema: OzonDetectedIssueSchema },
                {
                    name: OzonAuditRecommendationEntity.name,
                    schema: OzonAuditRecommendationSchema,
                },
                { name: OzonAuditRunEntity.name, schema: OzonAuditRunSchema },
                { name: OzonAiReportEntity.name, schema: OzonAiReportSchema },
                { name: AlertEventEntity.name, schema: AlertEventSchema },
                { name: ComplianceLogEntity.name, schema: ComplianceLogSchema },
            ],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    controllers: [],
    providers: [
        OzonCredentialsCryptoService,
        OzonConnectionAuditService,
        OzonConnectionService,
        SellerDataSyncService,
        CompetitorTrackingService,
        OfficialOzonCompetitorDataProvider,
        LlmAdvisorProvider,
        OzonAiContextBuilderService,
        OzonAiAdvisorService,
        OzonMetricsBuilderService,
        StockoutRiskDetector,
        OverstockDetector,
        AdsWasteDetector,
        PriceLeakDetector,
        ReturnSpikeDetector,
        OzonIssueDetectorService,
        OzonRecommendationBuilderService,
        OzonAuditDataQualityService,
        OzonAuditRunService,
        OzonAuditService,
        ProductAnalyticsService,
        TelegramAlertService,
        AlertsService,
        AlertQueueProducerService,
        AlertDispatchProcessor,
        OzonQueueProducerService,
        OzonSyncProcessor,
        OzonAuditProcessor,
        OzonCompetitorProcessor,
    ],
    exports: [
        OzonConnectionService,
        OzonConnectionAuditService,
        SellerDataSyncService,
        CompetitorTrackingService,
        OzonAuditService,
        ProductAnalyticsService,
        AlertsService,
        OzonQueueProducerService,
    ],
})
export class OzonModule {}
