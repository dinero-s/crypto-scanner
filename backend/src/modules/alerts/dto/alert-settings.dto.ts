import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Обновление настроек алертов */
export class UpdateAlertSettingsDto {
    @ApiPropertyOptional({ description: 'Включены ли уведомления' })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    @ApiPropertyOptional({ description: 'Мин. funding rate (доля, напр. 0.0003)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    minFundingRate?: number;

    @ApiPropertyOptional({ description: 'Мин. net yield (%)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    minNetYield?: number;

    @ApiPropertyOptional({ description: 'Мин. basis (%)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    minBasis?: number;

    @ApiPropertyOptional({ description: 'Разрешённые биржи (пусто = все)', enum: ExchangeEnum, isArray: true })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsEnum(ExchangeEnum, { each: true })
    allowedExchanges?: ExchangeEnum[];

    @ApiPropertyOptional({ description: 'Whitelist символов BASE/QUOTE (пусто = все)' })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(100)
    @IsString({ each: true })
    symbolsWhitelist?: string[];

    @ApiPropertyOptional({ description: 'Cooldown между алертами (сек)' })
    @IsOptional()
    @IsNumber()
    @Min(60)
    @Max(86400)
    alertCooldownSec?: number;
}

/** Ответ с настройками алертов */
export class AlertSettingsResponseDto {
    @ApiProperty({ description: 'Включены ли уведомления' })
    enabled: boolean;

    @ApiProperty({ description: 'Мин. funding rate (доля)' })
    minFundingRate: number;

    @ApiProperty({ description: 'Мин. net yield (%)' })
    minNetYield: number;

    @ApiProperty({ description: 'Мин. basis (%)' })
    minBasis: number;

    @ApiProperty({ description: 'Разрешённые биржи', enum: ExchangeEnum, isArray: true })
    allowedExchanges: ExchangeEnum[];

    @ApiProperty({ description: 'Whitelist символов' })
    symbolsWhitelist: string[];

    @ApiProperty({ description: 'Cooldown (сек)' })
    alertCooldownSec: number;
}
