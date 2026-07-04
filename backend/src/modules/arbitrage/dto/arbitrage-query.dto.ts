import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';

/** Фильтр арбитражных возможностей */
export class ArbitrageQueryDto {
    @ApiPropertyOptional({ description: 'Тип арбитража', enum: ArbitrageTypeEnum })
    @IsOptional()
    @IsEnum(ArbitrageTypeEnum)
    type?: ArbitrageTypeEnum;

    @ApiPropertyOptional({ description: 'Биржа spot', enum: ExchangeEnum })
    @IsOptional()
    @IsEnum(ExchangeEnum)
    exchange?: ExchangeEnum;

    @ApiPropertyOptional({ description: 'Символ (spot)' })
    @IsOptional()
    @IsString()
    symbol?: string;

    @ApiPropertyOptional({ description: 'Минимальный net yield (%)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minNetYield?: number;

    @ApiPropertyOptional({ description: 'Минимальный funding rate (доля)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minFundingRate?: number;

    @ApiPropertyOptional({ description: 'Максимальный spot-perp spread (%)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    maxSpread?: number;

    @ApiPropertyOptional({ description: 'Минимальный объём 24h (USD)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    minVolume24h?: number;

    @ApiPropertyOptional({ description: 'Разрешённые биржи', enum: ExchangeEnum, isArray: true })
    @IsOptional()
    @IsArray()
    @IsEnum(ExchangeEnum, { each: true })
    allowedExchanges?: ExchangeEnum[];

    @ApiPropertyOptional({ description: 'Whitelist символов', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    symbolWhitelist?: string[];

    @ApiPropertyOptional({ description: 'Blacklist символов', type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    symbolBlacklist?: string[];

    @ApiPropertyOptional({ description: 'Размер позиции USD для расчёта прибыли' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    positionSizeUsd?: number;

    @ApiPropertyOptional({ description: 'Лимит', default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 50;
}

/** Запрос top opportunities */
export class ArbitrageTopQueryDto {
    @ApiPropertyOptional({ description: 'Лимит', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Тип арбитража', enum: ArbitrageTypeEnum })
    @IsOptional()
    @IsEnum(ArbitrageTypeEnum)
    type?: ArbitrageTypeEnum;
}
