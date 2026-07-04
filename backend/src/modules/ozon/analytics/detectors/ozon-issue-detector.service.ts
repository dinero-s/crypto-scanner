import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    OzonDetectedIssueDoc,
    OzonDetectedIssueEntity,
} from '../entities/ozon-detected-issue.entity';
import {
    OzonMetricSnapshotDoc,
    OzonMetricSnapshotEntity,
} from '../entities/ozon-metric-snapshot.entity';
import { OzonDetectedIssueStatus } from '../../constants/ozon.enums';
import { DetectedIssueDraft, MetricSnapshotView } from '../interfaces/audit.interfaces';
import { OzonAuditDataQuality } from '../interfaces/data-quality.interfaces';
import { AdsWasteDetector } from './ads-waste.detector';
import { OverstockDetector } from './overstock.detector';
import { PriceLeakDetector } from './price-leak.detector';
import { ReturnSpikeDetector } from './return-spike.detector';
import { StockoutRiskDetector } from './stockout-risk.detector';
import {
    groupSnapshotsByProduct,
    startOfDayUtc,
    toMetricView,
} from '../metrics/metric-utils';
import { buildIssueKey } from '../utils/audit-key.utils';
import { AuditPeriodDays } from '../services/ozon-audit-run.service';
import { OzonAuditDataQualityService } from '../services/ozon-audit-data-quality.service';

/** Оркестратор детерминированных детекторов проблем */
@Injectable()
export class OzonIssueDetectorService {
    private readonly logger = new Logger(OzonIssueDetectorService.name);

    constructor(
        @DatabaseModel(OzonMetricSnapshotEntity.name)
        private readonly metricSnapshotModel: Model<OzonMetricSnapshotDoc>,
        @DatabaseModel(OzonDetectedIssueEntity.name)
        private readonly issueModel: Model<OzonDetectedIssueDoc>,
        private readonly stockoutRiskDetector: StockoutRiskDetector,
        private readonly overstockDetector: OverstockDetector,
        private readonly adsWasteDetector: AdsWasteDetector,
        private readonly priceLeakDetector: PriceLeakDetector,
        private readonly returnSpikeDetector: ReturnSpikeDetector,
        private readonly dataQualityService: OzonAuditDataQualityService,
    ) {}

    async detectIssues(
        userId: string,
        integrationId: string,
        dataQuality: OzonAuditDataQuality,
        auditRunId: string,
        periodFrom: Date,
        periodTo: Date,
        periodDays: AuditPeriodDays,
    ): Promise<OzonDetectedIssueDoc[]> {
        const referenceDate = periodTo;
        const historyDays = Math.max(periodDays, 60);
        const from = startOfDayUtc(
            new Date(referenceDate.getTime() - historyDays * 24 * 60 * 60 * 1000),
        );

        const docs = await this.metricSnapshotModel
            .find({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                date: { $gte: from },
            })
            .sort({ date: 1 })
            .exec();

        const views = docs.map((doc) => toMetricView(doc));
        const byProduct = groupSnapshotsByProduct(views);
        const storeAvgReturnsRate = this.calculateStoreAvgReturnsRate(views);

        const drafts: DetectedIssueDraft[] = [];

        for (const productSnapshots of byProduct.values()) {
            const detectorDrafts: Array<DetectedIssueDraft | null> = [];

            if (this.dataQualityService.isDetectorEnabled(dataQuality, 'stockoutRisk')) {
                detectorDrafts.push(
                    this.stockoutRiskDetector.detect(productSnapshots, referenceDate),
                );
            }
            if (this.dataQualityService.isDetectorEnabled(dataQuality, 'overstock')) {
                detectorDrafts.push(
                    this.overstockDetector.detect(productSnapshots, referenceDate),
                );
            }
            if (this.dataQualityService.isDetectorEnabled(dataQuality, 'adsWaste')) {
                detectorDrafts.push(
                    this.adsWasteDetector.detect(productSnapshots, referenceDate),
                );
            }
            if (this.dataQualityService.isDetectorEnabled(dataQuality, 'priceLeak')) {
                detectorDrafts.push(
                    this.priceLeakDetector.detect(productSnapshots, referenceDate),
                );
            }
            if (this.dataQualityService.isDetectorEnabled(dataQuality, 'returnSpike')) {
                detectorDrafts.push(
                    this.returnSpikeDetector.detect(
                        productSnapshots,
                        referenceDate,
                        storeAvgReturnsRate,
                    ),
                );
            }

            for (const draft of detectorDrafts) {
                if (draft) {
                    drafts.push(draft);
                }
            }
        }

        const saved: OzonDetectedIssueDoc[] = [];

        if (drafts.length === 0) {
            return saved;
        }

        const draftKeys = drafts.map((draft) =>
            buildIssueKey(
                draft.userId,
                draft.integrationId,
                draft.offerId,
                draft.productId,
                draft.type,
            ),
        );

        const existingIssues = await this.issueModel
            .find({
                userId: new Types.ObjectId(userId),
                issueKey: { $in: draftKeys },
                status: {
                    $in: [
                        OzonDetectedIssueStatus.NEW,
                        OzonDetectedIssueStatus.VIEWED,
                    ],
                },
            })
            .exec();

        const existingByKey = new Map(
            existingIssues.map((issue) => [issue.issueKey, issue]),
        );

        const bulkOps: Array<{
            updateOne: {
                filter: Record<string, unknown>;
                update: Record<string, unknown>;
                upsert?: boolean;
            };
        }> = [];

        for (const draft of drafts) {
            const issueKey = buildIssueKey(
                draft.userId,
                draft.integrationId,
                draft.offerId,
                draft.productId,
                draft.type,
            );
            const existing = existingByKey.get(issueKey);

            if (existing) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: existing._id },
                        update: {
                            $set: {
                                severity: draft.severity,
                                confidence: draft.confidence,
                                estimatedLossMin: draft.estimatedLossMin,
                                estimatedLossMax: draft.estimatedLossMax,
                                lossCalculationConfidence: draft.lossCalculationConfidence,
                                lossExplanation: draft.lossExplanation,
                                evidence: draft.evidence,
                                summary: draft.summary,
                                title: draft.title,
                                detectedAt: referenceDate,
                                auditRunId: new Types.ObjectId(auditRunId),
                                periodFrom,
                                periodTo,
                            },
                        },
                    },
                });
                continue;
            }

            bulkOps.push({
                updateOne: {
                    filter: {
                        userId: new Types.ObjectId(draft.userId),
                        issueKey,
                    },
                    update: {
                        $setOnInsert: {
                            userId: new Types.ObjectId(draft.userId),
                            integrationId: new Types.ObjectId(draft.integrationId),
                            productId: draft.productId,
                            offerId: draft.offerId,
                            sku: draft.sku,
                            type: draft.type,
                            severity: draft.severity,
                            confidence: draft.confidence,
                            estimatedLossMin: draft.estimatedLossMin,
                            estimatedLossMax: draft.estimatedLossMax,
                            lossCalculationConfidence: draft.lossCalculationConfidence,
                            lossExplanation: draft.lossExplanation,
                            title: draft.title,
                            summary: draft.summary,
                            evidence: draft.evidence,
                            status: OzonDetectedIssueStatus.NEW,
                            detectedAt: referenceDate,
                            issueKey,
                            auditRunId: new Types.ObjectId(auditRunId),
                            periodFrom,
                            periodTo,
                        },
                    },
                    upsert: true,
                },
            });
        }

        if (bulkOps.length > 0) {
            await this.issueModel.bulkWrite(bulkOps, { ordered: false });
        }

        const persisted = await this.issueModel
            .find({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                auditRunId: new Types.ObjectId(auditRunId),
            })
            .exec();

        saved.push(...persisted);

        this.logger.log(
            `detected issues userId=${userId} integrationId=${integrationId} count=${String(saved.length)}`,
        );

        return saved;
    }

    private calculateStoreAvgReturnsRate(snapshots: MetricSnapshotView[]): number {
        const totalReturns = snapshots.reduce((acc, s) => acc + (s.returnsCount ?? 0), 0);
        const totalUnits = snapshots.reduce((acc, s) => acc + (s.unitsSold ?? 0), 0);
        if (totalUnits <= 0) {
            return 0;
        }
        return totalReturns / totalUnits;
    }
}
