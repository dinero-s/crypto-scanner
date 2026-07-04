import { Injectable, Logger } from '@nestjs/common';
import { NetYieldCalculationDto } from '../dto/arbitrage-opportunity.dto';

/** Расчёт net yield с учётом комиссий, спреда и slippage */
@Injectable()
export class NetYieldCalculatorService {
    private readonly logger = new Logger(NetYieldCalculatorService.name);

    /** Рассчитать net yield (% годовых) */
    calculateNetYield(dto: NetYieldCalculationDto): number {
        const slippage = dto.estimatedSlippage ?? 0;
        const spread = dto.spreadCost ?? 0;
        const roundTripFeesPct =
            (dto.spotFeeRate + dto.futuresFeeRate) * 2 * 100;
        const frictionPct = roundTripFeesPct + slippage * 100 + spread * 100;
        const net = dto.grossYieldPct - frictionPct;
        this.logger.debug(
            `netYield: ${dto.symbol}@${dto.exchange} gross=${String(dto.grossYieldPct)} net=${String(net)}`,
        );
        return net;
    }

    /** Annualize funding rate (8h → год) */
    annualizeFundingRate(fundingRate: number, intervalsPerDay = 3): number {
        return fundingRate * intervalsPerDay * 365 * 100;
    }

    /** Annualize basis */
    annualizeBasis(basisPct: number, daysToExpiry: number): number {
        if (daysToExpiry <= 0) {
            return basisPct;
        }
        return (basisPct / daysToExpiry) * 365;
    }
}
