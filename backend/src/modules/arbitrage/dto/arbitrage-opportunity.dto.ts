import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { FundingDirectionEnum, TradeVerdictEnum } from '../enums/arbitrage-type.enum';

/** Параметры расчёта net yield */
export class NetYieldCalculationDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Символ' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Gross yield (%)' })
    @IsNumber()
    grossYieldPercent: number;

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

    @ApiPropertyOptional({ description: 'Спред spot-perp (%)' })
    @IsOptional()
    @IsNumber()
    spreadPercent?: number;
}

/** Funding opportunity (ответ API) */
export class FundingOpportunityDto {
    @ApiProperty({ description: 'ID возможности' })
    id: string;

    @ApiProperty({ description: 'Базовый актив' })
    baseAsset: string;

    @ApiProperty({ description: 'Котируемый актив' })
    quoteAsset: string;

    @ApiProperty({ description: 'Биржа spot', enum: ExchangeEnum })
    spotExchange: ExchangeEnum;

    @ApiProperty({ description: 'Биржа futures', enum: ExchangeEnum })
    futuresExchange: ExchangeEnum;

    @ApiProperty({ description: 'Символ spot' })
    spotSymbol: string;

    @ApiProperty({ description: 'Символ perpetual' })
    futuresSymbol: string;

    @ApiProperty({ description: 'Направление', enum: FundingDirectionEnum })
    direction: FundingDirectionEnum;

    @ApiProperty({ description: 'Funding rate (доля за интервал)' })
    fundingRate: number;

    @ApiPropertyOptional({ description: 'Прогноз funding rate' })
    predictedFundingRate?: number;

    @ApiPropertyOptional({ description: 'Время следующего funding (unix ms)' })
    nextFundingTime?: number;

    @ApiPropertyOptional({ description: 'Минуты до funding' })
    timeToFundingMinutes?: number;

    @ApiProperty({ description: 'Spot ask' })
    spotAsk: number;

    @ApiProperty({ description: 'Perp bid' })
    perpBid: number;

    @ApiProperty({ description: 'Spot-perp spread (%)' })
    spotPerpSpreadPercent: number;

    @ApiProperty({ description: 'Оценка комиссий (%)' })
    estimatedFeesPercent: number;

    @ApiProperty({ description: 'Оценка slippage (%)' })
    estimatedSlippagePercent: number;

    @ApiProperty({ description: 'Net funding (%) — доход только от funding за интервал' })
    netFundingPercent: number;

    @ApiProperty({ description: 'Итог (%) — funding + спред при входе − fees − slippage' })
    totalNetAfterEntryPercent: number;

    @ApiProperty({ description: 'Вердикт сделки', enum: TradeVerdictEnum })
    tradeVerdict: TradeVerdictEnum;

    @ApiProperty({ description: 'Ожидаемая чистая прибыль USD (по итоговому net)' })
    estimatedNetProfitUsd: number;

    @ApiPropertyOptional({ description: 'Теоретический APR (%) — не гарантированная доходность' })
    theoreticalApr?: number;

    @ApiProperty({ description: 'Флаг: APR теоретический' })
    isTheoreticalApr: boolean;

    @ApiProperty({ description: 'Risk score 0–100' })
    riskScore: number;

    @ApiProperty({ description: 'Opportunity score 0–100' })
    opportunityScore: number;

    @ApiProperty({ description: 'Время расчёта (unix ms)' })
    calculatedAt: number;
}

/** Cash & Carry opportunity (ответ API) */
export class CashCarryOpportunityDto {
    @ApiProperty({ description: 'ID возможности' })
    id: string;

    @ApiProperty({ description: 'Базовый актив' })
    baseAsset: string;

    @ApiProperty({ description: 'Котируемый актив' })
    quoteAsset: string;

    @ApiProperty({ description: 'Биржа spot', enum: ExchangeEnum })
    spotExchange: ExchangeEnum;

    @ApiProperty({ description: 'Биржа futures', enum: ExchangeEnum })
    futuresExchange: ExchangeEnum;

    @ApiProperty({ description: 'Символ spot' })
    spotSymbol: string;

    @ApiProperty({ description: 'Символ futures/perp' })
    futuresSymbol: string;

    @ApiProperty({ description: 'Spot ask' })
    spotAsk: number;

    @ApiProperty({ description: 'Futures/perp bid' })
    perpBid: number;

    @ApiProperty({ description: 'Basis (%)' })
    basisPercent: number;

    @ApiProperty({ description: 'Оценка комиссий (%)' })
    estimatedFeesPercent: number;

    @ApiProperty({ description: 'Оценка slippage (%)' })
    estimatedSlippagePercent: number;

    @ApiProperty({ description: 'Net basis (%) — ожидаемая доходность' })
    netBasisPercent: number;

    @ApiProperty({ description: 'Итог (%) — basis − fees − slippage' })
    totalNetAfterEntryPercent: number;

    @ApiProperty({ description: 'Вердикт сделки', enum: TradeVerdictEnum })
    tradeVerdict: TradeVerdictEnum;

    @ApiPropertyOptional({ description: 'Annualized APR (%) при наличии expiry' })
    annualizedApr?: number;

    @ApiPropertyOptional({ description: 'Теоретический APR (%) для perpetual' })
    theoreticalApr?: number;

    @ApiProperty({ description: 'Флаг: APR теоретический' })
    isTheoreticalApr: boolean;

    @ApiProperty({ description: 'Risk score 0–100' })
    riskScore: number;

    @ApiProperty({ description: 'Opportunity score 0–100' })
    opportunityScore: number;

    @ApiProperty({ description: 'Время расчёта (unix ms)' })
    calculatedAt: number;
}

/** Статистика арбитража */
export class ArbitrageStatsDto {
    @ApiProperty({ description: 'Всего funding opportunities' })
    fundingCount: number;

    @ApiProperty({ description: 'Всего cash & carry opportunities' })
    cashCarryCount: number;

    @ApiProperty({ description: 'Средний opportunity score' })
    avgOpportunityScore: number;

    @ApiProperty({ description: 'Максимальный net yield (%)' })
    maxNetYieldPercent: number;

    @ApiProperty({ description: 'Время последнего расчёта (unix ms)' })
    lastCalculatedAt: number | null;
}

/** Детальная возможность (любой тип) */
export class ArbitrageOpportunityDetailDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: 'Тип', enum: ['funding', 'cash_carry'] })
    type: string;

    @ApiProperty({ description: 'Базовый актив' })
    baseAsset: string;

    @ApiProperty({ description: 'Котируемый актив' })
    quoteAsset: string;

    @ApiProperty({ description: 'Биржа spot', enum: ExchangeEnum })
    spotExchange: ExchangeEnum;

    @ApiProperty({ description: 'Биржа futures', enum: ExchangeEnum })
    futuresExchange: ExchangeEnum;

    @ApiProperty({ description: 'Spot symbol' })
    spotSymbol: string;

    @ApiProperty({ description: 'Futures symbol' })
    futuresSymbol: string;

    @ApiProperty({ description: 'Spot price (ask)' })
    spotPrice: number;

    @ApiProperty({ description: 'Futures price (bid)' })
    futuresPrice: number;

    @ApiPropertyOptional({ description: 'Funding rate' })
    fundingRate?: number;

    @ApiPropertyOptional({ description: 'Predicted funding rate' })
    predictedFundingRate?: number;

    @ApiPropertyOptional({ description: 'Basis (%)' })
    basisPercent?: number;

    @ApiProperty({ description: 'Net yield (%) — итоговая ожидаемая доходность за интервал' })
    netYieldPercent: number;

    @ApiPropertyOptional({ description: 'Вердикт сделки', enum: TradeVerdictEnum })
    tradeVerdict?: TradeVerdictEnum;

    @ApiPropertyOptional({ description: 'Итог (%) с учётом спреда при входе' })
    totalNetAfterEntryPercent?: number;

    @ApiProperty({ description: 'Ожидаемая прибыль USD' })
    estimatedProfitUsd: number;

    @ApiPropertyOptional({ description: 'Annualized/theoretical APR (%)' })
    annualizedApr?: number;

    @ApiProperty({ description: 'Opportunity score' })
    opportunityScore: number;

    @ApiProperty({ description: 'Risk score' })
    riskScore: number;

    @ApiPropertyOptional({ description: 'Next funding time' })
    nextFundingTime?: number;

    @ApiPropertyOptional({ description: 'Expires at' })
    expiresAt?: number;

    @ApiProperty({ description: 'Calculated at' })
    calculatedAt: number;

    @ApiPropertyOptional({ description: 'Доп. метрики' })
    metadata?: Record<string, number | string | boolean>;
}
