import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { FundingDirectionEnum } from '../enums/arbitrage-type.enum';

/** Параметры расчёта net yield */
export class NetYieldCalculationDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Символ' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Gross yield (% годовых)' })
    @IsNumber()
    grossYieldPct: number;

    @ApiProperty({ description: 'Комиссия spot (taker, доля)' })
    @IsNumber()
    spotFeeRate: number;

    @ApiProperty({ description: 'Комиссия futures (taker, доля)' })
    @IsNumber()
    futuresFeeRate: number;

    @ApiPropertyOptional({ description: 'Оценка slippage (доля)' })
    @IsOptional()
    @IsNumber()
    estimatedSlippage?: number;

    @ApiPropertyOptional({ description: 'Спред bid-ask (доля)' })
    @IsOptional()
    @IsNumber()
    spreadCost?: number;
}

/** Funding opportunity (ответ API) */
export class FundingOpportunityDto {
    @ApiProperty({ description: 'Символ' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Направление', enum: FundingDirectionEnum })
    @IsEnum(FundingDirectionEnum)
    direction: FundingDirectionEnum;

    @ApiProperty({ description: 'Funding rate' })
    @IsNumber()
    fundingRate: number;

    @ApiProperty({ description: 'Net yield (% годовых)' })
    @IsNumber()
    netYieldPct: number;
}

/** Cash & Carry opportunity (ответ API) */
export class CashCarryOpportunityDto {
    @ApiProperty({ description: 'Символ' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Basis (%)' })
    @IsNumber()
    basisPct: number;

    @ApiProperty({ description: 'Net yield (% годовых)' })
    @IsNumber()
    netYieldPct: number;
}
