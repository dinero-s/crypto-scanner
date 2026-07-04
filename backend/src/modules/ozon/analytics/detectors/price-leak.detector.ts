import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    OzonAuditSeverity,
    OzonDetectedIssueType,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';
import {
    DetectedIssueDraft,
    MetricSnapshotView,
} from '../interfaces/audit.interfaces';
import { filterLastDays, latestSnapshot } from '../metrics/metric-utils';

/** Детектор утечки прибыли из-за снижения цены */
@Injectable()
export class PriceLeakDetector {
    constructor(private readonly configService: ConfigService) {}

    detect(
        snapshots: MetricSnapshotView[],
        referenceDate: Date,
    ): DetectedIssueDraft | null {
        const sorted = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());
        if (sorted.length < 14) {
            return null;
        }

        const latest = latestSnapshot(sorted);
        if (!latest || latest.price === undefined) {
            return null;
        }

        const priceDropThreshold =
            this.configService.get<number>('ozon.audit.priceDropPercentThreshold') ?? 0.05;

        const recentPeriod = filterLastDays(sorted, 7, referenceDate);
        const previousPeriod = filterLastDays(
            sorted.filter((s) => s.date < (recentPeriod[0]?.date ?? referenceDate)),
            7,
            new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        );

        if (recentPeriod.length < 3 || previousPeriod.length < 3) {
            return null;
        }

        const avgPriceBefore =
            previousPeriod.reduce((acc, s) => acc + (s.price ?? 0), 0) / previousPeriod.length;
        const avgPriceAfter =
            recentPeriod.reduce((acc, s) => acc + (s.price ?? 0), 0) / recentPeriod.length;

        if (avgPriceBefore <= 0) {
            return null;
        }

        const priceDrop = (avgPriceBefore - avgPriceAfter) / avgPriceBefore;
        if (priceDrop < priceDropThreshold) {
            return null;
        }

        const unitsBefore =
            previousPeriod.reduce((acc, s) => acc + (s.unitsSold ?? 0), 0) / previousPeriod.length;
        const unitsAfter =
            recentPeriod.reduce((acc, s) => acc + (s.unitsSold ?? 0), 0) / recentPeriod.length;

        const salesGrowth = unitsBefore > 0 ? (unitsAfter - unitsBefore) / unitsBefore : 0;
        const significantGrowth = salesGrowth >= 0.1;

        const profitBefore = previousPeriod.reduce(
            (acc, s) => acc + (s.grossProfitEstimate ?? 0),
            0,
        );
        const profitAfter = recentPeriod.reduce(
            (acc, s) => acc + (s.grossProfitEstimate ?? 0),
            0,
        );

        if (significantGrowth) {
            return null;
        }

        if (profitBefore > 0 && profitAfter >= profitBefore) {
            return null;
        }

        const estimatedLossMax =
            profitBefore > profitAfter ? Math.round(profitBefore - profitAfter) : undefined;

        const lossCalculationConfidence =
            estimatedLossMax !== undefined
                ? OzonLossCalculationConfidence.MEDIUM
                : OzonLossCalculationConfidence.LOW;
        const lossExplanation =
            estimatedLossMax !== undefined
                ? 'Потеря маржи после снижения цены без роста заказов'
                : 'Потери не рассчитаны: недостаточно финансовых данных для сравнения маржи';

        return {
            userId: latest.userId,
            integrationId: latest.integrationId,
            productId: latest.productId,
            offerId: latest.offerId,
            sku: latest.sku,
            type: OzonDetectedIssueType.PRICE_LEAK,
            severity: OzonAuditSeverity.MEDIUM,
            confidence: 0.7,
            estimatedLossMax,
            lossCalculationConfidence,
            lossExplanation,
            title: `Снижение цены без роста продаж: ${latest.sku ?? latest.offerId ?? latest.productId}`,
            summary: `Цена снизилась на ${Math.round(priceDrop * 100)}%, продажи не выросли значимо`,
            evidence: [
                {
                    metric: 'avgPriceBefore',
                    value: Math.round(avgPriceBefore),
                    period: '7d_before',
                },
                {
                    metric: 'avgPriceAfter',
                    value: Math.round(avgPriceAfter),
                    period: '7d_after',
                },
                {
                    metric: 'priceDropPercent',
                    value: Math.round(priceDrop * 1000) / 1000,
                    threshold: priceDropThreshold,
                },
                {
                    metric: 'avgDailyUnitsBefore',
                    value: Math.round(unitsBefore * 10) / 10,
                    period: '7d_before',
                },
                {
                    metric: 'avgDailyUnitsAfter',
                    value: Math.round(unitsAfter * 10) / 10,
                    period: '7d_after',
                },
            ],
        };
    }
}
