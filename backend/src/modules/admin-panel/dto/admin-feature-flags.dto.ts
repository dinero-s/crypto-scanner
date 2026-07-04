import { ApiProperty } from '@nestjs/swagger';

export class AdminFeatureFlagsResponseDto {
    @ApiProperty({ description: 'Ozon Operator включён' })
    OZON_OPERATOR_ENABLED: boolean;

    @ApiProperty({ description: 'Wildberries Operator включён' })
    WB_OPERATOR_ENABLED: boolean;

    @ApiProperty({ description: 'LLM Advisor включён' })
    LLM_ADVISOR_ENABLED: boolean;

    @ApiProperty({ description: 'Telegram alerts включены' })
    TELEGRAM_ALERTS_ENABLED: boolean;

    @ApiProperty({ description: 'Email alerts включены' })
    EMAIL_ALERTS_ENABLED: boolean;

    @ApiProperty({ description: 'Auto sync включён' })
    AUTO_SYNC_ENABLED: boolean;

    @ApiProperty({ description: 'Competitor tracking включён' })
    COMPETITOR_TRACKING_ENABLED: boolean;
}
