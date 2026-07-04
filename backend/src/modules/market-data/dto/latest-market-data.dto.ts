import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Запрос latest market data */
export class LatestMarketDataQueryDto {
    @ApiPropertyOptional({ description: 'Биржа', enum: ExchangeEnum })
    @IsOptional()
    @IsEnum(ExchangeEnum)
    exchange?: ExchangeEnum;

    @ApiPropertyOptional({ description: 'Символ (BTC/USDT)' })
    @IsOptional()
    @IsString()
    symbol?: string;

    @ApiPropertyOptional({ description: 'Лимит записей', default: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(500)
    limit?: number = 100;
}

/** Spot-тикер для ответа API */
export class SpotTickerResponseDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Символ' })
    symbol: string;

    @ApiProperty({ description: 'Bid' })
    bid: number;

    @ApiProperty({ description: 'Ask' })
    ask: number;

    @ApiProperty({ description: 'Last' })
    last: number;

    @ApiProperty({ description: 'Объём 24ч' })
    volume24h: number;

    @ApiProperty({ description: 'Timestamp котировки' })
    timestamp: number;
}

/** Perp-тикер для ответа API */
export class PerpTickerResponseDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Символ' })
    symbol: string;

    @ApiProperty({ description: 'Bid' })
    bid: number;

    @ApiProperty({ description: 'Ask' })
    ask: number;

    @ApiProperty({ description: 'Last' })
    last: number;

    @ApiProperty({ description: 'Mark price' })
    markPrice: number;

    @ApiProperty({ description: 'Index price' })
    indexPrice: number;

    @ApiProperty({ description: 'Open interest' })
    openInterest: number;

    @ApiProperty({ description: 'Timestamp котировки' })
    timestamp: number;
}

/** Funding rate для ответа API */
export class FundingRateResponseDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Символ' })
    symbol: string;

    @ApiProperty({ description: 'Funding rate' })
    fundingRate: number;

    @ApiPropertyOptional({ description: 'Predicted funding rate' })
    predictedFundingRate?: number;

    @ApiPropertyOptional({ description: 'Следующее funding time (unix ms), если известно' })
    nextFundingTime?: number | null;

    @ApiProperty({ description: 'Timestamp' })
    timestamp: number;
}

/** Статус биржи для ответа API */
export class ExchangeHealthResponseDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Доступна' })
    healthy: boolean;

    @ApiProperty({ description: 'Последняя проверка' })
    lastCheckedAt: string;

    @ApiPropertyOptional({ description: 'Последний успех' })
    lastSuccessAt?: string;

    @ApiPropertyOptional({ description: 'Последняя ошибка' })
    lastError?: string;

    @ApiPropertyOptional({ description: 'Latency, мс' })
    latencyMs?: number;
}
