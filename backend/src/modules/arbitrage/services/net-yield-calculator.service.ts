import { Injectable, Logger } from '@nestjs/common';
import { NetYieldCalculationDto } from '../dto/arbitrage-opportunity.dto';
import {
    calculateAnnualizedBasisApr,
    calculateEstimatedProfitUsd,
    calculateFeesPercent,
    calculateNetBasisPercent,
    calculateNetFundingPercent,
    calculateSlippagePercent,
    calculateTheoreticalFundingApr,
    isPositiveNetYield,
} from '../utils/arbitrage-math.util';

/** Расчёт net yield с учётом комиссий, спреда и slippage (Decimal.js) */
@Injectable()
export class NetYieldCalculatorService {
    private readonly logger = new Logger(NetYieldCalculatorService.name);

    /** Рассчитать net yield (%) */
    calculateNetYield(dto: NetYieldCalculationDto): number {
        const feesPercent = calculateFeesPercent(dto.spotFeeRate, dto.futuresFeeRate);
        const slippagePercent = calculateSlippagePercent(dto.estimatedSlippage ?? 0);
        const spread = dto.spreadPercent ?? 0;
        return calculateNetBasisPercent(dto.grossYieldPercent, feesPercent + spread, slippagePercent);
    }

    /** netFundingPercent = fundingRate - fees - slippage */
    calculateNetFunding(
        fundingRate: number,
        spotFeeRate: number,
        futuresFeeRate: number,
        slippageRate: number,
    ): { netFundingPercent: number; feesPercent: number; slippagePercent: number } {
        const feesPercent = calculateFeesPercent(spotFeeRate, futuresFeeRate);
        const slippagePercent = calculateSlippagePercent(slippageRate);
        const netFundingPercent = calculateNetFundingPercent(
            fundingRate,
            feesPercent,
            slippagePercent,
        );
        return { netFundingPercent, feesPercent, slippagePercent };
    }

    /** netBasisPercent = basis - fees - slippage */
    calculateNetBasis(
        basisPercent: number,
        spotFeeRate: number,
        futuresFeeRate: number,
        slippageRate: number,
    ): { netBasisPercent: number; feesPercent: number; slippagePercent: number } {
        const feesPercent = calculateFeesPercent(spotFeeRate, futuresFeeRate);
        const slippagePercent = calculateSlippagePercent(slippageRate);
        const netBasisPercent = calculateNetBasisPercent(
            basisPercent,
            feesPercent,
            slippagePercent,
        );
        return { netBasisPercent, feesPercent, slippagePercent };
    }

    /** Ожидаемая прибыль USD */
    calculateProfitUsd(positionSizeUsd: number, netPercent: number): number {
        return calculateEstimatedProfitUsd(positionSizeUsd, netPercent);
    }

    /** Теоретический APR для funding */
    calculateFundingApr(
        netFundingPercent: number,
        fundingIntervalHours: number,
    ): number | null {
        return calculateTheoreticalFundingApr(netFundingPercent, fundingIntervalHours);
    }

    /** Annualized APR для basis с expiry */
    calculateBasisApr(netBasisPercent: number, daysToExpiry: number): number | null {
        return calculateAnnualizedBasisApr(netBasisPercent, daysToExpiry);
    }

    /** Проверка: opportunity имеет положительный net */
    isValidOpportunity(netPercent: number): boolean {
        const valid = isPositiveNetYield(netPercent);
        if (!valid) {
            this.logger.debug('opportunity отфильтрована: net <= 0');
        }
        return valid;
    }
}
