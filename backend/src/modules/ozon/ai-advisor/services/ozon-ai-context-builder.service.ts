import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import {
    OzonAiReportType,
    OzonAuditRecommendationStatus,
    OzonAuditSeverity,
    OzonDetectedIssueStatus,
} from '../../constants/ozon.enums';
import {
    OzonAuditRecommendationDoc,
    OzonAuditRecommendationEntity,
} from '../../analytics/entities/ozon-audit-recommendation.entity';
import {
    OzonDetectedIssueDoc,
    OzonDetectedIssueEntity,
} from '../../analytics/entities/ozon-detected-issue.entity';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { RecommendationContext } from '../interfaces/audit-ai.interfaces';
import { OzonAuditDataQuality } from '../../analytics/interfaces/data-quality.interfaces';
import { OzonAuditRunDoc } from '../../analytics/entities/ozon-audit-run.entity';
import { OzonAuditRunService } from '../../analytics/services/ozon-audit-run.service';
import {
    compressIssuesForLlm,
    sortIssuesBySeverity,
} from '../utils/llm-context.utils';
import { ConfigService } from '@nestjs/config';

/** Сборка контекста для AI Profit Audit из рассчитанных фактов */
@Injectable()
export class OzonAiContextBuilderService {
    constructor(
        @DatabaseModel(OzonDetectedIssueEntity.name)
        private readonly issueModel: Model<OzonDetectedIssueDoc>,
        @DatabaseModel(OzonAuditRecommendationEntity.name)
        private readonly recommendationModel: Model<OzonAuditRecommendationDoc>,
        private readonly auditRunService: OzonAuditRunService,
        private readonly configService: ConfigService,
    ) {}

    async buildContext(
        userId: string,
        integrationId: string,
        reportType: OzonAiReportType,
        periodFrom: Date,
        periodTo: Date,
        dataQuality: OzonAuditDataQuality,
        auditRun: OzonAuditRunDoc,
        issuesOverride?: OzonDetectedIssueDoc[],
    ): Promise<RecommendationContext> {
        const maxIssues =
            this.configService.get<number>('ozon.audit.llmMaxIssues') ?? 15;
        const rawIssues =
            issuesOverride ??
            (await this.issueModel
                .find({
                    userId: new Types.ObjectId(userId),
                    integrationId: new Types.ObjectId(integrationId),
                    auditRunId: auditRun._id,
                    status: {
                        $in: [
                            OzonDetectedIssueStatus.NEW,
                            OzonDetectedIssueStatus.VIEWED,
                        ],
                    },
                })
                .sort({ detectedAt: -1 })
                .limit(50)
                .exec());

        const sortedIssues = sortIssuesBySeverity(rawIssues).slice(0, maxIssues);

        const recommendations = await this.recommendationModel
            .find({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                issueId: { $in: sortedIssues.map((issue) => issue._id) },
                status: {
                    $in: [
                        OzonAuditRecommendationStatus.NEW,
                        OzonAuditRecommendationStatus.VIEWED,
                    ],
                },
            })
            .exec();

        const recByIssue = new Map<string, OzonAuditRecommendationDoc>();
        for (const rec of recommendations) {
            recByIssue.set(rec.issueId.toString(), rec);
        }

        let estimatedLossMin = 0;
        let estimatedLossMax = 0;
        let criticalIssues = 0;
        let highIssues = 0;

        const issueItems = sortedIssues.map((issue) => {
            if (issue.severity === OzonAuditSeverity.CRITICAL) {
                criticalIssues += 1;
            }
            if (issue.severity === OzonAuditSeverity.HIGH) {
                highIssues += 1;
            }
            estimatedLossMin += issue.estimatedLossMin ?? 0;
            estimatedLossMax += issue.estimatedLossMax ?? 0;

            const rec = recByIssue.get(issue._id.toString());

            return {
                type: issue.type,
                severity: issue.severity,
                confidence: issue.confidence,
                title: issue.title,
                summary: issue.summary,
                estimatedLossMin: issue.estimatedLossMin,
                estimatedLossMax: issue.estimatedLossMax,
                lossCalculationConfidence: issue.lossCalculationConfidence,
                lossExplanation: issue.lossExplanation,
                evidence: issue.evidence,
                recommendation: {
                    title: rec?.title ?? issue.title,
                    steps: rec?.steps ?? [],
                },
            };
        });

        const lossCalculationConfidence =
            this.auditRunService.calculateAggregateLossConfidence(sortedIssues);

        const compressedIssues = compressIssuesForLlm(issueItems, maxIssues, 3, 200);

        return {
            reportType,
            auditRun: {
                id: String(auditRun._id),
                periodFrom: periodFrom.toISOString(),
                periodTo: periodTo.toISOString(),
                periodDays: auditRun.periodDays,
                status: auditRun.status,
            },
            period: {
                from: periodFrom.toISOString().slice(0, 10),
                to: periodTo.toISOString().slice(0, 10),
            },
            summary: {
                totalIssues: sortedIssues.length,
                criticalIssues,
                highIssues,
                estimatedLossMin,
                estimatedLossMax,
                lossCalculationConfidence,
            },
            dataQuality: {
                score: dataQuality.score,
                state: dataQuality.state,
                missingData: dataQuality.missingData.map((item) => ({
                    type: item.type,
                    title: item.title,
                    impact: item.impact,
                })),
                warnings: dataQuality.warnings,
                detectorAvailability: dataQuality.detectorAvailability as unknown as Record<
                    string,
                    { status: string; reason?: string }
                >,
                checkedDetectorsCount: dataQuality.checkedDetectorsCount,
                availableDetectorsCount: dataQuality.availableDetectorsCount,
                partialDetectorsCount: dataQuality.partialDetectorsCount,
                unavailableDetectorsCount: dataQuality.unavailableDetectorsCount,
            },
            issues: compressedIssues,
        };
    }
}
