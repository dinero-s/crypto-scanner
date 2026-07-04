import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExchangeEnum } from '../enums/exchange.enum';

/** Funding rate (нормализованный) */
export class FundingRateDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Унифицированный символ' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Нативный символ биржи' })
    @IsString()
    nativeSymbol: string;

    @ApiProperty({ description: 'Текущий funding rate (доля, напр. 0.0001 = 0.01%)' })
    @IsNumber()
    fundingRate: number;

    @ApiPropertyOptional({ description: 'Прогноз следующего funding rate' })
    @IsOptional()
    @IsNumber()
    predictedFundingRate?: number;

    @ApiProperty({ description: 'Время следующего funding (unix ms)' })
    @IsNumber()
    nextFundingTime: number;

    @ApiPropertyOptional({ description: 'Признак прогноза (не факт)' })
    @IsOptional()
    @IsBoolean()
    isPredicted?: boolean;

    @ApiProperty({ description: 'Время снимка (unix ms)' })
    @IsNumber()
    timestamp: number;
}
