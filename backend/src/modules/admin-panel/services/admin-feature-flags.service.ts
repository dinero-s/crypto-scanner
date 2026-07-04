import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminFeatureFlagsResponseDto } from '../dto/admin-feature-flags.dto';

/** Read-only feature flags из ConfigService */
@Injectable()
export class AdminFeatureFlagsService {
    constructor(private readonly configService: ConfigService) {}

    getFeatureFlags(): AdminFeatureFlagsResponseDto {
        return {
            OZON_OPERATOR_ENABLED:
                this.configService.get<boolean>('ozon.features.ozonOperatorEnabled') !== false,
            WB_OPERATOR_ENABLED:
                this.configService.get<boolean>('ozon.features.wbOperatorEnabled') === true,
            LLM_ADVISOR_ENABLED:
                this.configService.get<boolean>('ozon.features.llmAdvisorEnabled') === true,
            TELEGRAM_ALERTS_ENABLED:
                this.configService.get<boolean>('ozon.features.telegramAlertsEnabled') === true,
            EMAIL_ALERTS_ENABLED:
                this.configService.get<boolean>('ozon.features.emailAlertsEnabled') === true,
            AUTO_SYNC_ENABLED:
                this.configService.get<boolean>('ozon.features.autoSyncEnabled') !== false,
            COMPETITOR_TRACKING_ENABLED:
                this.configService.get<boolean>('ozon.features.competitorTrackingEnabled') !== false,
        };
    }
}
