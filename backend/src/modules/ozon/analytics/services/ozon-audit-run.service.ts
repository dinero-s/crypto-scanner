import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    OzonAuditRunProgressStep,
    OzonAuditRunStatus,
    OzonAuditSeverity,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';
import {
    OzonAuditRunDoc,
    OzonAuditRunEntity,
} from '../entities/ozon-audit-run.entity';
import { OzonAuditDataQuality } from '../interfaces/data-quality.interfaces';
import { OzonDetectedIssueDoc } from '../entities/ozon-detected-issue.entity';

export interface AuditRunStartResult {
    auditRunId: string;
    status: OzonAuditRunStatus;
    progressStep: OzonAuditRunProgressStep;
    isExisting: boolean;
}

export interface AuditRunView {
    id: string;
    status: string;
    progressStep: string;
    periodFrom: string;
    periodTo: string;
    periodDays: number;
    dataQualityScore?: number;
    dataQualityState?: string;
    issuesCount?: number;
    recommendationsCount?: number;
    estimatedLossMin?: number;
    estimatedLossMax?: number;
    lossCalculationConfidence?: string;
    startedAt?: string;
    finishedAt?: string;
    errorMessage?: string;
}

export type AuditPeriodDays = 30 | 60 | 90;

/** Управление жизненным циклом запусков Profit Audit */
@Injectable()
export class OzonAuditRunService {
    private readonly logger = new Logger(OzonAuditRunService.name);

    constructor(
        @DatabaseModel(OzonAuditRunEntity.name)
        private readonly auditRunModel: Model<OzonAuditRunDoc>,
    ) {}

    async findActiveRun(
        userId: string,
        integrationId: string,
    ): Promise<OzonAuditRunDoc | null> {
        return this.auditRunModel
            .findOne({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                status: {
                    $in: [OzonAuditRunStatus.QUEUED, OzonAuditRunStatus.RUNNING],
                },
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    async startOrReturnActive(
        userId: string,
        integrationId: string,
        periodDays: AuditPeriodDays = 30,
        jobId?: string,
    ): Promise<AuditRunStartResult> {
        const active = await this.findActiveRun(userId, integrationId);
        if (active) {
            return this.toStartResult(active, true);
        }

        const periodTo = new Date();
        const periodFrom = new Date(
            periodTo.getTime() - periodDays * 24 * 60 * 60 * 1000,
        );

        try {
            const auditRun = await this.auditRunModel.create({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(integrationId),
                status: OzonAuditRunStatus.QUEUED,
                progressStep: OzonAuditRunProgressStep.QUEUED,
                periodFrom,
                periodTo,
                periodDays,
                jobId,
            });

            this.logger.log(
                `auditRun created id=${String(auditRun._id)} userId=${userId} periodDays=${String(periodDays)}`,
            );

            return this.toStartResult(auditRun, false);
        } catch (error: unknown) {
            if (!this.isDuplicateActiveAuditRunError(error)) {
                throw error;
            }

            const existing = await this.findActiveRun(userId, integrationId);
            if (!existing) {
                throw error;
            }

            this.logger.log(
                `auditRun race resolved userId=${userId} integrationId=${integrationId} auditRunId=${String(existing._id)}`,
            );

            return this.toStartResult(existing, true);
        }
    }

    async findById(auditRunId: string): Promise<OzonAuditRunDoc | null> {
        return this.auditRunModel.findById(auditRunId).exec();
    }

    async getLatestRun(
        userId: string,
        integrationId?: string,
    ): Promise<OzonAuditRunDoc | null> {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
        };
        if (integrationId) {
            filter.integrationId = new Types.ObjectId(integrationId);
        }

        return this.auditRunModel.findOne(filter).sort({ createdAt: -1 }).exec();
    }

    async markRunning(auditRunId: string): Promise<void> {
        await this.auditRunModel.updateOne(
            { _id: new Types.ObjectId(auditRunId) },
            {
                status: OzonAuditRunStatus.RUNNING,
                startedAt: new Date(),
            },
        );
    }

    async updateProgressStep(
        auditRunId: string,
        progressStep: OzonAuditRunProgressStep,
    ): Promise<void> {
        await this.auditRunModel.updateOne(
            { _id: new Types.ObjectId(auditRunId) },
            { progressStep },
        );
    }

    async saveDataQualitySnapshot(
        auditRunId: string,
        dataQuality: OzonAuditDataQuality,
    ): Promise<void> {
        await this.auditRunModel.updateOne(
            { _id: new Types.ObjectId(auditRunId) },
            {
                dataQualityScore: dataQuality.score,
                dataQualityState: dataQuality.state,
                dataQualitySnapshot: dataQuality as unknown as Record<string, unknown>,
            },
        );
    }

    async finalizeSuccess(
        auditRunId: string,
        dataQuality: OzonAuditDataQuality,
        issues: OzonDetectedIssueDoc[],
        recommendationsCount: number,
    ): Promise<void> {
        const status =
            dataQuality.score >= 80
                ? OzonAuditRunStatus.SUCCESS
                : OzonAuditRunStatus.PARTIAL_DATA;

        await this.applyFinalMetrics(
            auditRunId,
            status,
            dataQuality,
            issues,
            recommendationsCount,
        );
    }

    async finalizeFailed(
        auditRunId: string,
        errorMessage: string,
        errorCode?: string,
    ): Promise<void> {
        await this.auditRunModel.updateOne(
            { _id: new Types.ObjectId(auditRunId) },
            {
                status: OzonAuditRunStatus.FAILED,
                progressStep: OzonAuditRunProgressStep.FAILED,
                errorMessage,
                errorCode,
                finishedAt: new Date(),
            },
        );
    }

    toView(doc: OzonAuditRunDoc): AuditRunView {
        return {
            id: String(doc._id),
            status: doc.status,
            progressStep: doc.progressStep,
            periodFrom: doc.periodFrom.toISOString(),
            periodTo: doc.periodTo.toISOString(),
            periodDays: doc.periodDays,
            dataQualityScore: doc.dataQualityScore,
            dataQualityState: doc.dataQualityState,
            issuesCount: doc.issuesCount,
            recommendationsCount: doc.recommendationsCount,
            estimatedLossMin: doc.estimatedLossMin,
            estimatedLossMax: doc.estimatedLossMax,
            lossCalculationConfidence: doc.lossCalculationConfidence,
            startedAt: doc.startedAt?.toISOString(),
            finishedAt: doc.finishedAt?.toISOString(),
            errorMessage: doc.errorMessage,
        };
    }

    calculateAggregateLossConfidence(
        issues: OzonDetectedIssueDoc[],
    ): OzonLossCalculationConfidence {
        if (issues.length === 0) {
            return OzonLossCalculationConfidence.LOW;
        }

        const withLoss = issues.filter(
            (issue) =>
                issue.estimatedLossMin !== undefined ||
                issue.estimatedLossMax !== undefined,
        );

        if (withLoss.length === 0) {
            return OzonLossCalculationConfidence.LOW;
        }

        const confidences = withLoss.map((issue) => issue.lossCalculationConfidence);

        if (confidences.every((c) => c === OzonLossCalculationConfidence.HIGH)) {
            return OzonLossCalculationConfidence.HIGH;
        }

        if (confidences.some((c) => c === OzonLossCalculationConfidence.LOW)) {
            return OzonLossCalculationConfidence.LOW;
        }

        return OzonLossCalculationConfidence.MEDIUM;
    }

    private async applyFinalMetrics(
        auditRunId: string,
        status: OzonAuditRunStatus.SUCCESS | OzonAuditRunStatus.PARTIAL_DATA,
        dataQuality: OzonAuditDataQuality,
        issues: OzonDetectedIssueDoc[],
        recommendationsCount: number,
    ): Promise<void> {
        let criticalIssuesCount = 0;
        let highIssuesCount = 0;
        let estimatedLossMin = 0;
        let estimatedLossMax = 0;

        for (const issue of issues) {
            if (issue.severity === OzonAuditSeverity.CRITICAL) {
                criticalIssuesCount += 1;
            }
            if (issue.severity === OzonAuditSeverity.HIGH) {
                highIssuesCount += 1;
            }
            estimatedLossMin += issue.estimatedLossMin ?? 0;
            estimatedLossMax += issue.estimatedLossMax ?? 0;
        }

        const lossCalculationConfidence =
            this.calculateAggregateLossConfidence(issues);

        await this.auditRunModel.updateOne(
            { _id: new Types.ObjectId(auditRunId) },
            {
                status,
                progressStep: OzonAuditRunProgressStep.DONE,
                finishedAt: new Date(),
                dataQualityScore: dataQuality.score,
                dataQualityState: dataQuality.state,
                issuesCount: issues.length,
                criticalIssuesCount,
                highIssuesCount,
                recommendationsCount,
                estimatedLossMin:
                    estimatedLossMax > 0 ? estimatedLossMin : undefined,
                estimatedLossMax:
                    estimatedLossMax > 0 ? estimatedLossMax : undefined,
                lossCalculationConfidence,
            },
        );
    }

    private toStartResult(
        auditRun: OzonAuditRunDoc,
        isExisting: boolean,
    ): AuditRunStartResult {
        return {
            auditRunId: String(auditRun._id),
            status: auditRun.status,
            progressStep: auditRun.progressStep,
            isExisting,
        };
    }

    private isDuplicateActiveAuditRunError(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const mongoError = error as { code?: number; message?: string };
        if (mongoError.code === 11_000) {
            return true;
        }

        return (
            typeof mongoError.message === 'string' &&
            mongoError.message.includes('unique_active_audit_run_per_connection')
        );
    }
}
