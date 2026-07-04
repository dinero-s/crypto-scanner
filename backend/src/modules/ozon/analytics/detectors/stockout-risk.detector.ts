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
    hadSalesInPeriod,
    latestSnapshot,
} from '../metrics/metric-utils';

/** Детектор риска out-of-stock */
@Injectable()
export class StockoutRiskDetector {
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
        const salesLookback = filterLastDays(snapshots, lookbackDays, referenceDate);
        const avgDailySales = avgDailyMetric(salesLookback, 'unitsSold', lookbackDays);

        if (avgDailySales <= 0) {
            return null;
        }

        if (!hadSalesInPeriod(snapshots, lookbackDays, referenceDate)) {
            return null;
        }

        const stockAvailable = latest.stockAvailable ?? 0;
        const stockDaysLeft = stockAvailable / avgDailySales;
        const threshold = this.configService.get<number>('ozon.audit.stockoutDaysThreshold') ?? 14;

        if (stockDaysLeft > threshold) {
            return null;
        }

        let severity = OzonAuditSeverity.MEDIUM;
        if (stockDaysLeft <= 3) {
            severity = OzonAuditSeverity.CRITICAL;
        } else if (stockDaysLeft <= 7) {
            severity = OzonAuditSeverity.HIGH;
        }

        const dailyRevenue = latest.price !== undefined ? latest.price * avgDailySales : undefined;
        const estimatedLossMin =
            dailyRevenue !== undefined ? Math.round(dailyRevenue * stockDaysLeft) : undefined;
        const estimatedLossMax =
            dailyRevenue !== undefined ? Math.round(dailyRevenue * 30) : undefined;

        const lossCalculationConfidence =
            dailyRevenue !== undefined
                ? OzonLossCalculationConfidence.HIGH
                : OzonLossCalculationConfidence.LOW;
        const lossExplanation =
            dailyRevenue !== undefined
                ? 'Оценка потерь: средняя дневная выручка × дни до out-of-stock'
                : 'Потери не рассчитаны: недостаточно данных о цене и продажах';

        return {
            userId: latest.userId,
            integrationId: latest.integrationId,
            productId: latest.productId,
            offerId: latest.offerId,
            sku: latest.sku,
            type: OzonDetectedIssueType.STOCKOUT_RISK,
            severity,
            confidence: 0.85,
            estimatedLossMin,
            estimatedLossMax,
            lossCalculationConfidence,
            lossExplanation,
            title: `Риск out-of-stock: ${latest.sku ?? latest.offerId ?? latest.productId}`,
            summary: `Остаток закончится примерно через ${Math.round(stockDaysLeft)} дней при текущих продажах`,
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
                    value: Math.round(stockDaysLeft * 10) / 10,
                    threshold,
                },
            ],
        };
    }
}
