import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { AlertTypeEnum } from '../enums/alert-type.enum';

/** Пороги для алертов */
export class AlertThresholdDto {
    @ApiProperty({ description: 'Тип алерта', enum: AlertTypeEnum })
    @IsEnum(AlertTypeEnum)
    type: AlertTypeEnum;

    @ApiPropertyOptional({ description: 'Биржа', enum: ExchangeEnum })
    @IsOptional()
    @IsEnum(ExchangeEnum)
    exchange?: ExchangeEnum;

    @ApiPropertyOptional({ description: 'Символ' })
    @IsOptional()
    @IsString()
    symbol?: string;

    @ApiProperty({ description: 'Минимальный net yield (%) для уведомления' })
    @IsNumber()
    minNetYieldPct: number;

    @ApiPropertyOptional({ description: 'Минимальный funding rate (доля)' })
    @IsOptional()
    @IsNumber()
    minFundingRate?: number;

    @ApiPropertyOptional({ description: 'Минимальный basis (%)' })
    @IsOptional()
    @IsNumber()
    minBasisPct?: number;
}

/** Создание настроек алертов */
export class CreateAlertSettingsDto {
    @ApiProperty({ description: 'Telegram user ID' })
    @IsString()
    telegramUserId: string;

    @ApiProperty({ description: 'Включены ли уведомления' })
    @IsBoolean()
    enabled: boolean;

    @ApiProperty({ description: 'Пороги', type: [AlertThresholdDto] })
    thresholds: AlertThresholdDto[];
}

/** Обновление настроек алертов */
export class UpdateAlertSettingsDto {
    @ApiPropertyOptional({ description: 'Включены ли уведомления' })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiPropertyOptional({ description: 'Пороги', type: [AlertThresholdDto] })
    @IsOptional()
    thresholds?: AlertThresholdDto[];
}
