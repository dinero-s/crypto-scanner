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

/** Детектор всплеска возвратов */
@Injectable()
export class ReturnSpikeDetector {
    constructor(private readonly configService: ConfigService) {}

    detect(
        snapshots: MetricSnapshotView[],
        referenceDate: Date,
        storeAvgReturnsRate: number,
    ): DetectedIssueDraft | null {
        const latest = latestSnapshot(snapshots);
        if (!latest) {
            return null;
        }

        const period = filterLastDays(snapshots, 30, referenceDate);
        const returnsCount = period.reduce((acc, s) => acc + (s.returnsCount ?? 0), 0);
        const minReturns =
            this.configService.get<number>('ozon.audit.minReturnsCount') ?? 3;

        if (returnsCount < minReturns) {
            return null;
        }

        const unitsSold = period.reduce((acc, s) => acc + (s.unitsSold ?? 0), 0);
        if (unitsSold <= 0) {
            return null;
        }

        const returnsRate = returnsCount / unitsSold;

        if (storeAvgReturnsRate <= 0 || returnsRate <= storeAvgReturnsRate * 2) {
            return null;
        }

        return {
            userId: latest.userId,
            integrationId: latest.integrationId,
            productId: latest.productId,
            offerId: latest.offerId,
            sku: latest.sku,
            type: OzonDetectedIssueType.RETURN_SPIKE,
            severity:
                returnsRate > storeAvgReturnsRate * 3
                    ? OzonAuditSeverity.HIGH
                    : OzonAuditSeverity.MEDIUM,
            confidence: 0.78,
            lossCalculationConfidence: OzonLossCalculationConfidence.LOW,
            lossExplanation:
                'Потери не рассчитаны: нет точной стоимости возврата по товару',
            title: `Высокая доля возвратов: ${latest.sku ?? latest.offerId ?? latest.productId}`,
            summary: `Доля возвратов ${Math.round(returnsRate * 1000) / 10}% — в ${Math.round((returnsRate / storeAvgReturnsRate) * 10) / 10}× выше среднего по магазину`,
            evidence: [
                {
                    metric: 'returnsCount',
                    value: returnsCount,
                    period: '30d',
                    threshold: minReturns,
                },
                {
                    metric: 'returnsRate',
                    value: Math.round(returnsRate * 1000) / 1000,
                    threshold: storeAvgReturnsRate * 2,
                },
                {
                    metric: 'storeAvgReturnsRate',
                    value: Math.round(storeAvgReturnsRate * 1000) / 1000,
                    period: '30d',
                },
            ],
        };
    }
}
