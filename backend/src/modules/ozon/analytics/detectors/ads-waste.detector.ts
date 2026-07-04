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
import { filterLastDays, latestSnapshot, sumMetric } from '../metrics/metric-utils';

/** Детектор неэффективной рекламы */
@Injectable()
export class AdsWasteDetector {
    constructor(private readonly configService: ConfigService) {}

    detect(
        snapshots: MetricSnapshotView[],
        referenceDate: Date,
    ): DetectedIssueDraft | null {
        const latest = latestSnapshot(snapshots);
        if (!latest) {
            return null;
        }

        const period = filterLastDays(snapshots, 7, referenceDate);
        const adSpend = sumMetric(period, 'adSpend');
        const adOrders = sumMetric(period, 'adOrders');
        const revenue = sumMetric(period, 'revenue');

        const minAdSpend =
            this.configService.get<number>('ozon.audit.minAdSpendForIssue') ?? 500;
        const minAdOrders =
            this.configService.get<number>('ozon.audit.minAdOrders') ?? 1;
        const maxAllowedDrr =
            this.configService.get<number>('ozon.audit.maxAllowedDrr') ?? 0.25;

        if (adSpend <= 0 || adSpend < minAdSpend) {
            return null;
        }

        const drr = revenue > 0 ? adSpend / revenue : adSpend > 0 ? 1 : 0;

        if (adOrders >= minAdOrders && drr <= maxAllowedDrr) {
            return null;
        }

        const isIneffective = adOrders < minAdOrders || drr > maxAllowedDrr;
        if (!isIneffective) {
            return null;
        }

        return {
            userId: latest.userId,
            integrationId: latest.integrationId,
            productId: latest.productId,
            offerId: latest.offerId,
            sku: latest.sku,
            type: OzonDetectedIssueType.ADS_WASTE,
            severity: drr > maxAllowedDrr * 2 ? OzonAuditSeverity.HIGH : OzonAuditSeverity.MEDIUM,
            confidence: 0.8,
            estimatedLossMin: Math.round(adSpend * 0.3),
            estimatedLossMax: Math.round(adSpend),
            lossCalculationConfidence: OzonLossCalculationConfidence.MEDIUM,
            lossExplanation:
                'Часть рекламного расхода выглядит неэффективной (низкий ROAS или высокий ДРР)',
            title: `Неэффективная реклама: ${latest.sku ?? latest.offerId ?? latest.productId}`,
            summary: `За 7 дней расход ${Math.round(adSpend)} ₽, заказов из рекламы: ${adOrders}, ДРР ${Math.round(drr * 100)}%`,
            evidence: [
                { metric: 'adSpend', value: Math.round(adSpend), period: '7d', threshold: minAdSpend },
                { metric: 'adOrders', value: adOrders, period: '7d', threshold: minAdOrders },
                { metric: 'drr', value: Math.round(drr * 1000) / 1000, threshold: maxAllowedDrr },
            ],
        };
    }
}
