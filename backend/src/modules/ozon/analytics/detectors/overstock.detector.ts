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
import {
    avgDailyMetric,
    filterLastDays,
    latestSnapshot,
} from '../metrics/metric-utils';

/** Детектор замороженных остатков (overstock) */
@Injectable()
export class OverstockDetector {
    constructor(private readonly configService: ConfigService) {}

    detect(
        snapshots: MetricSnapshotView[],
        referenceDate: Date,
    ): DetectedIssueDraft | null {
        const latest = latestSnapshot(snapshots);
        if (!latest) {
            return null;
        }

        const lookbackDays = 30;
        const period = filterLastDays(snapshots, lookbackDays, referenceDate);
        const avgDailySales = avgDailyMetric(period, 'unitsSold', lookbackDays);
        const stockAvailable = latest.stockAvailable ?? 0;

        if (stockAvailable <= 0) {
            return null;
        }

        const stockDaysLeft =
            avgDailySales > 0 ? stockAvailable / avgDailySales : Number.POSITIVE_INFINITY;
        const threshold =
            this.configService.get<number>('ozon.audit.overstockDaysThreshold') ?? 120;

        if (stockDaysLeft < threshold) {
            return null;
        }

        let estimatedLossMin: number | undefined;
        let estimatedLossMax: number | undefined;
        let lossCalculationConfidence = OzonLossCalculationConfidence.LOW;
        let lossExplanation = 'Потери не рассчитаны: нет данных о цене';

        if (latest.price !== undefined && latest.price > 0) {
            const frozenValue = stockAvailable * latest.price;
            estimatedLossMin = Math.round(frozenValue * 0.1);
            estimatedLossMax = Math.round(frozenValue);
            lossCalculationConfidence = OzonLossCalculationConfidence.MEDIUM;
            lossExplanation =
                'Замороженные деньги в остатках (не прямая потеря): стоимость товара на складе';
        }

        return {
            userId: latest.userId,
            integrationId: latest.integrationId,
            productId: latest.productId,
            offerId: latest.offerId,
            sku: latest.sku,
            type: OzonDetectedIssueType.OVERSTOCK,
            severity: OzonAuditSeverity.MEDIUM,
            confidence: 0.75,
            estimatedLossMin,
            estimatedLossMax,
            lossCalculationConfidence,
            lossExplanation,
            title: `Замороженные остатки: ${latest.sku ?? latest.offerId ?? latest.productId}`,
            summary: `Остатков хватит более чем на ${Math.round(stockDaysLeft)} дней при текущих продажах`,
            evidence: [
                {
                    metric: 'stockAvailable',
                    value: stockAvailable,
                    period: 'current',
                },
                {
                    metric: 'avgDailySales',
                    value: Math.round(avgDailySales * 100) / 100,
                    period: '30d',
                },
                {
                    metric: 'stockDaysLeft',
                    value: Math.round(stockDaysLeft),
                    threshold,
                },
            ],
        };
    }
}
