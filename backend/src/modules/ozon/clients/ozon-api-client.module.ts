import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import {
    ComplianceLogEntity,
    ComplianceLogSchema,
} from 'src/modules/admin-panel/entities/compliance-log.entity';
import { AllowedOzonApiService } from '../compliance/allowed-ozon-api.service';
import { ComplianceLogService } from '../compliance/compliance-log.service';
import { PerformanceApiClient } from './performance-api.client';
import { SellerApiClient } from './seller-api.client';
import { StatisticsApiClient } from './statistics-api.client';
import { OzonApiRateLimiterService } from './ozon-api-rate-limiter.service';

/** Модуль официальных Ozon API clients */
@Module({
    imports: [
        MongooseModule.forFeature(
            [{ name: ComplianceLogEntity.name, schema: ComplianceLogSchema }],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    providers: [
        OzonApiRateLimiterService,
        ComplianceLogService,
        AllowedOzonApiService,
        SellerApiClient,
        PerformanceApiClient,
        StatisticsApiClient,
    ],
    exports: [
        OzonApiRateLimiterService,
        ComplianceLogService,
        AllowedOzonApiService,
        SellerApiClient,
        PerformanceApiClient,
        StatisticsApiClient,
    ],
})
export class OzonApiClientModule {}
