import { Injectable } from '@nestjs/common';
import {
    NormalizedFundingRate,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from 'src/modules/exchanges/interfaces/normalized-market-data.interface';
import { MarketDataCacheService } from 'src/modules/market-data/services/market-data-cache.service';
import { FundingDirectionEnum } from '../enums/arbitrage-type.enum';
import {
    ArbitrageFilterConfig,
    CashCarryArbitrageInput,
    CalculatedOpportunity,
    FundingArbitrageInput,
} from '../interfaces/arbitrage-calculation.interface';
import { ArbitrageFilterService } from './arbitrage-filter.service';
import { ArbitrageScoringService } from './arbitrage-scoring.service';
import { NetYieldCalculatorService } from './net-yield-calculator.service';
import {
    buildMarketKey,
    calculateBasisPercent,
    calculateEntrySpreadImpactPercent,
    calculateSpotPerpSpreadPercent,
    calculateTimeToFundingMinutes,
    calculateTotalNetAfterEntryPercent,
    isValidPrice,
    resolveTradeVerdict,
} from '../utils/arbitrage-math.util';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';

export interface MarketDataBundle {
    spot: NormalizedSpotTicker[];
    perp: NormalizedPerpTicker[];
    funding: NormalizedFundingRate[];
}

/** Общая логика расчёта арбитражных возможностей */
@Injectable()
export class ArbitrageCalculationService {
    constructor(
        private readonly cacheService: MarketDataCacheService,
        private readonly filterService: ArbitrageFilterService,
        private readonly scoringService: ArbitrageScoringService,
        private readonly netYieldCalculator: NetYieldCalculatorService,
    ) {}

    /** Загрузить latest market data из Redis */
    async loadMarketData(): Promise<MarketDataBundle> {
        const [spot, perp, funding] = await Promise.all([
            this.cacheService.getLatestSpot(),
            this.cacheService.getLatestPerp(),
            this.cacheService.getLatestFunding(),
        ]);
        return { spot, perp, funding };
    }

    /** Построить индексы для быстрого поиска */
    buildIndexes(data: MarketDataBundle): {
        spotMap: Map<string, NormalizedSpotTicker>;
        perpMap: Map<string, NormalizedPerpTicker>;
        fundingMap: Map<string, NormalizedFundingRate>;
    } {
        const spotMap = new Map<string, NormalizedSpotTicker>();
        const perpMap = new Map<string, NormalizedPerpTicker>();
        const fundingMap = new Map<string, NormalizedFundingRate>();

        for (const ticker of data.spot) {
            spotMap.set(buildMarketKey(ticker.exchange, ticker.baseAsset, ticker.quoteAsset), ticker);
        }
        for (const ticker of data.perp) {
            perpMap.set(buildMarketKey(ticker.exchange, ticker.baseAsset, ticker.quoteAsset), ticker);
        }
        for (const rate of data.funding) {
            fundingMap.set(buildMarketKey(rate.exchange, rate.baseAsset, rate.quoteAsset), rate);
        }

        return { spotMap, perpMap, fundingMap };
    }

    /** Рассчитать все funding opportunities */
    calculateFundingOpportunities(
        data: MarketDataBundle,
        config: ArbitrageFilterConfig,
        nowMs: number,
    ): CalculatedOpportunity[] {
        const { spotMap, perpMap, fundingMap } = this.buildIndexes(data);
        const results: CalculatedOpportunity[] = [];

        for (const [key, spot] of spotMap) {
            const perp = perpMap.get(key);
            const funding = fundingMap.get(key);
            if (!perp || !funding) {
                continue;
            }
            if (!this.filterService.passesQuoteAssetFilter(spot.quoteAsset)) {
                continue;
            }

            const input: FundingArbitrageInput = {
                exchange: spot.exchange,
                baseAsset: spot.baseAsset,
                quoteAsset: spot.quoteAsset,
                spotSymbol: spot.symbol,
                futuresSymbol: perp.symbol,
                spotAsk: spot.ask,
                perpBid: perp.bid,
                volume24h: Math.min(spot.volume24h, perp.volume24h),
                fundingRate: funding.fundingRate,
                predictedFundingRate: funding.predictedFundingRate,
                nextFundingTime: funding.nextFundingTime,
                fundingIntervalHours: funding.fundingIntervalHours,
            };

            const opportunity = this.buildFundingOpportunity(input, config, nowMs);
            if (opportunity) {
                results.push(opportunity);
            }
        }

        return results;
    }

    /** Рассчитать все cash & carry opportunities */
    calculateCashCarryOpportunities(
        data: MarketDataBundle,
        config: ArbitrageFilterConfig,
        nowMs: number,
    ): CalculatedOpportunity[] {
        const { spotMap, perpMap, fundingMap } = this.buildIndexes(data);
        const results: CalculatedOpportunity[] = [];

        for (const [key, spot] of spotMap) {
            const perp = perpMap.get(key);
            if (!perp) {
                continue;
            }
            if (!this.filterService.passesQuoteAssetFilter(spot.quoteAsset)) {
                continue;
            }

            const funding = fundingMap.get(key);
            const input: CashCarryArbitrageInput = {
                exchange: spot.exchange,
                baseAsset: spot.baseAsset,
                quoteAsset: spot.quoteAsset,
                spotSymbol: spot.symbol,
                futuresSymbol: perp.symbol,
                spotAsk: spot.ask,
                perpBid: perp.bid,
                volume24h: Math.min(spot.volume24h, perp.volume24h),
                fundingRate: funding?.fundingRate,
                fundingIntervalHours: funding?.fundingIntervalHours,
            };

            const opportunity = this.buildCashCarryOpportunity(input, config, nowMs);
            if (opportunity) {
                results.push(opportunity);
            }
        }

        return results;
    }

    private buildFundingOpportunity(
        input: FundingArbitrageInput,
        config: ArbitrageFilterConfig,
        nowMs: number,
    ): CalculatedOpportunity | null {
        if (!this.filterService.isExchangeAllowed(input.exchange, config)) {
            return null;
        }
        if (!this.filterService.isSymbolAllowed(input.spotSymbol, config)) {
            return null;
        }
        if (!this.filterService.hasSufficientVolume(input.volume24h, config)) {
            return null;
        }
        if (!isValidPrice(input.spotAsk) || !isValidPrice(input.perpBid)) {
            return null;
        }

        const direction = this.resolveFundingDirection(input.fundingRate);
        if (!direction) {
            return null;
        }

        const effectiveFundingRate =
            direction === FundingDirectionEnum.LONG_SPOT_SHORT_PERP
                ? input.fundingRate
                : Math.abs(input.fundingRate);

        if (!this.filterService.passesFundingRateFilter(effectiveFundingRate, config)) {
            return null;
        }

        const spreadPercent = calculateSpotPerpSpreadPercent(input.perpBid, input.spotAsk);
        if (!this.filterService.passesSpreadFilter(spreadPercent, config)) {
            return null;
        }

        const { netFundingPercent, feesPercent, slippagePercent } =
            this.netYieldCalculator.calculateNetFunding(
                effectiveFundingRate,
                config.spotFeeRate,
                config.futuresFeeRate,
                config.defaultSlippage,
            );

        const entrySpreadImpactPercent = calculateEntrySpreadImpactPercent(
            direction,
            spreadPercent ?? 0,
        );
        const totalNetAfterEntryPercent = calculateTotalNetAfterEntryPercent(
            netFundingPercent,
            entrySpreadImpactPercent,
        );
        const tradeVerdict = resolveTradeVerdict(totalNetAfterEntryPercent);

        if (!this.filterService.passesNetYieldFilter(totalNetAfterEntryPercent, config)) {
            return null;
        }

        const theoreticalApr = this.netYieldCalculator.calculateFundingApr(
            netFundingPercent,
            input.fundingIntervalHours,
        );
        const estimatedProfitUsd = this.netYieldCalculator.calculateProfitUsd(
            config.defaultPositionSizeUsd,
            totalNetAfterEntryPercent,
        );

        const riskScore = this.scoringService.calculateRiskScore({
            netYieldPercent: totalNetAfterEntryPercent,
            spreadPercent,
            volume24h: input.volume24h,
            minVolume24h: config.minVolume24h,
            fundingRate: input.fundingRate,
            predictedFundingRate: input.predictedFundingRate,
        });
        const opportunityScore = this.scoringService.calculateOpportunityScore(
            {
                netYieldPercent: totalNetAfterEntryPercent,
                spreadPercent,
                volume24h: input.volume24h,
                minVolume24h: config.minVolume24h,
            },
            riskScore,
        );

        const timeToFundingMinutes = calculateTimeToFundingMinutes(input.nextFundingTime, nowMs);

        return {
            type: ArbitrageTypeEnum.FUNDING,
            baseAsset: input.baseAsset,
            quoteAsset: input.quoteAsset,
            spotExchange: input.exchange,
            futuresExchange: input.exchange,
            spotSymbol: input.spotSymbol,
            futuresSymbol: input.futuresSymbol,
            spotPrice: input.spotAsk,
            futuresPrice: input.perpBid,
            fundingRate: input.fundingRate,
            predictedFundingRate: input.predictedFundingRate,
            netYieldPercent: totalNetAfterEntryPercent,
            estimatedProfitUsd,
            annualizedApr: theoreticalApr ?? undefined,
            opportunityScore,
            riskScore,
            nextFundingTime: input.nextFundingTime,
            expiresAt: nowMs + config.opportunityTtlSec * 1000,
            metadata: {
                direction,
                spotPerpSpreadPercent: spreadPercent ?? 0,
                estimatedFeesPercent: feesPercent,
                estimatedSlippagePercent: slippagePercent,
                timeToFundingMinutes: timeToFundingMinutes ?? 0,
                isTheoreticalApr: true,
                volume24h: input.volume24h,
                grossYieldPercent: effectiveFundingRate * 100,
                netFundingPercent,
                entrySpreadImpactPercent,
                totalNetAfterEntryPercent,
                tradeVerdict,
            },
            calculatedAt: nowMs,
        };
    }

    private buildCashCarryOpportunity(
        input: CashCarryArbitrageInput,
        config: ArbitrageFilterConfig,
        nowMs: number,
    ): CalculatedOpportunity | null {
        if (!this.filterService.isExchangeAllowed(input.exchange, config)) {
            return null;
        }
        if (!this.filterService.isSymbolAllowed(input.spotSymbol, config)) {
            return null;
        }
        if (!this.filterService.hasSufficientVolume(input.volume24h, config)) {
            return null;
        }
        if (!isValidPrice(input.spotAsk) || !isValidPrice(input.perpBid)) {
            return null;
        }

        const basisPercent = calculateBasisPercent(input.perpBid, input.spotAsk);
        if (basisPercent === null) {
            return null;
        }

        const spreadPercent = basisPercent;
        if (!this.filterService.passesSpreadFilter(spreadPercent, config)) {
            return null;
        }

        const { netBasisPercent, feesPercent, slippagePercent } =
            this.netYieldCalculator.calculateNetBasis(
                basisPercent,
                config.spotFeeRate,
                config.futuresFeeRate,
                config.defaultSlippage,
            );

        if (!this.filterService.passesNetYieldFilter(netBasisPercent, config)) {
            return null;
        }

        let annualizedApr: number | undefined;
        let isTheoreticalApr = true;

        if (input.daysToExpiry !== undefined && input.daysToExpiry > 0) {
            const apr = this.netYieldCalculator.calculateBasisApr(
                netBasisPercent,
                input.daysToExpiry,
            );
            annualizedApr = apr ?? undefined;
            isTheoreticalApr = false;
        } else if (input.fundingIntervalHours !== undefined && input.fundingRate !== undefined) {
            const fundingApr = this.netYieldCalculator.calculateFundingApr(
                netBasisPercent,
                input.fundingIntervalHours,
            );
            annualizedApr = fundingApr ?? undefined;
            isTheoreticalApr = true;
        }

        const tradeVerdict = resolveTradeVerdict(netBasisPercent);

        const estimatedProfitUsd = this.netYieldCalculator.calculateProfitUsd(
            config.defaultPositionSizeUsd,
            netBasisPercent,
        );

        const riskScore = this.scoringService.calculateRiskScore({
            netYieldPercent: netBasisPercent,
            spreadPercent,
            volume24h: input.volume24h,
            minVolume24h: config.minVolume24h,
        });
        const opportunityScore = this.scoringService.calculateOpportunityScore(
            {
                netYieldPercent: netBasisPercent,
                spreadPercent,
                volume24h: input.volume24h,
                minVolume24h: config.minVolume24h,
            },
            riskScore,
        );

        return {
            type: ArbitrageTypeEnum.CASH_CARRY,
            baseAsset: input.baseAsset,
            quoteAsset: input.quoteAsset,
            spotExchange: input.exchange,
            futuresExchange: input.exchange,
            spotSymbol: input.spotSymbol,
            futuresSymbol: input.futuresSymbol,
            spotPrice: input.spotAsk,
            futuresPrice: input.perpBid,
            fundingRate: input.fundingRate,
            basisPercent,
            netYieldPercent: netBasisPercent,
            estimatedProfitUsd,
            annualizedApr,
            opportunityScore,
            riskScore,
            expiresAt: nowMs + config.opportunityTtlSec * 1000,
            metadata: {
                estimatedFeesPercent: feesPercent,
                estimatedSlippagePercent: slippagePercent,
                isTheoreticalApr,
                volume24h: input.volume24h,
                grossYieldPercent: basisPercent,
                totalNetAfterEntryPercent: netBasisPercent,
                tradeVerdict,
            },
            calculatedAt: nowMs,
        };
    }

    private resolveFundingDirection(fundingRate: number): FundingDirectionEnum | null {
        if (!Number.isFinite(fundingRate) || fundingRate === 0) {
            return null;
        }
        if (fundingRate > 0) {
            return FundingDirectionEnum.LONG_SPOT_SHORT_PERP;
        }
        return FundingDirectionEnum.SHORT_SPOT_LONG_PERP;
    }
}
