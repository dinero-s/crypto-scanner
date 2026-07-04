import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
    AlertEventType,
    OzonAiReportType,
    OzonAuditRecommendationStatus,
    OzonAuditRunProgressStep,
    OzonAuditRunStatus,
    OzonAuditUiState,
    OzonConnectionAuditAction,
    OzonConnectionAuditStatus,
    OzonDetectedIssueStatus,
    OzonSeverity,
} from '../../constants/ozon.enums';
import {
    OzonAiReportDoc,
    OzonAiReportEntity,
} from '../entities/ozon-ai-report.entity';
import {
    OzonAuditRecommendationDoc,
    OzonAuditRecommendationEntity,
} from '../entities/ozon-audit-recommendation.entity';
import {
    OzonDetectedIssueDoc,
    OzonDetectedIssueEntity,
} from '../entities/ozon-detected-issue.entity';
import { OzonAuditRunDoc, OzonAuditRunEntity } from '../entities/ozon-audit-run.entity';
import { OzonIssueDetectorService } from '../detectors/ozon-issue-detector.service';
import { OzonMetricsBuilderService } from '../metrics/ozon-metrics-builder.service';
import { OzonRecommendationBuilderService } from '../recommendations/ozon-recommendation-builder.service';
import { OzonAiAdvisorService } from '../../ai-advisor/services/ozon-ai-advisor.service';
import { OzonAiContextBuilderService } from '../../ai-advisor/services/ozon-ai-context-builder.service';
import { AlertsService } from '../../alerts/services/alerts.service';
import { OzonConnectionAuditService } from '../../integration/services/ozon-connection-audit.service';
import { OzonConnectionService } from '../../integration/services/ozon-connection.service';
import { OzonQueueProducerService } from '../../queue/ozon-queue.producer.service';
import { OzonAuditStepJobData } from '../../queue/interfaces/ozon-queue.interface';
import { SellerDataSyncService } from '../../seller/services/seller-data-sync.service';
import { OzonAuditDataQualityService } from './ozon-audit-data-quality.service';
import {
    getFirstAuditStep,
    getNextAuditStep,
    isAuditStepCompleted,
} from '../utils/audit-pipeline.utils';
import {
    AuditPeriodDays,
    AuditRunView,
    OzonAuditRunService,
} from './ozon-audit-run.service';
import { OzonAuditDataQuality } from '../interfaces/data-quality.interfaces';
import { toSafeErrorMessage } from '../utils/safe-error.utils';
import { RecommendationContext } from '../../ai-advisor/interfaces/audit-ai.interfaces';

export interface AuditRunResult {
    auditRunId: string;
    status: OzonAuditRunStatus;
    progressStep: OzonAuditRunProgressStep;
}

export interface AuditStatusView {
    state: OzonAuditUiState;
    auditRun?: AuditRunView;
    latestReportId?: string;
}

export interface LatestAuditReportView {
    report?: {
        id: string;
        auditRunId?: string;
        type: string;
        aiText: string;
        facts: Record<string, unknown>;
        createdAt: string;
    };
    auditRun?: AuditRunView;
    dataQuality?: OzonAuditDataQuality;
    topIssues: OzonDetectedIssueDoc[];
    topRecommendations: OzonAuditRecommendationDoc[];
    empty?: boolean;
    message?: string;
}

/** Оркестратор Profit Audit pipeline */
@Injectable()
export class OzonAuditService {
    private readonly logger = new Logger(OzonAuditService.name);

    constructor(
        @DatabaseModel(OzonAiReportEntity.name)
        private readonly aiReportModel: Model<OzonAiReportDoc>,
        @DatabaseModel(OzonDetectedIssueEntity.name)
        private readonly issueModel: Model<OzonDetectedIssueDoc>,
        @DatabaseModel(OzonAuditRecommendationEntity.name)
        private readonly recommendationModel: Model<OzonAuditRecommendationDoc>,
        @DatabaseModel(OzonAuditRunEntity.name)
        private readonly auditRunModel: Model<OzonAuditRunDoc>,
        private readonly connectionService: OzonConnectionService,
        private readonly connectionAuditService: OzonConnectionAuditService,
        private readonly sellerDataSyncService: SellerDataSyncService,
        private readonly metricsBuilder: OzonMetricsBuilderService,
        private readonly issueDetector: OzonIssueDetectorService,
        private readonly recommendationBuilder: OzonRecommendationBuilderService,
        private readonly aiContextBuilder: OzonAiContextBuilderService,
        private readonly aiAdvisor: OzonAiAdvisorService,
        private readonly dataQualityService: OzonAuditDataQualityService,
        private readonly auditRunService: OzonAuditRunService,
        private readonly alertsService: AlertsService,
        private readonly queueProducer: OzonQueueProducerService,
        private readonly configService: ConfigService,
    ) {}

    async runAuditAsync(
        userId: string,
        connectionId?: string,
        periodDays: AuditPeriodDays = 30,
    ): Promise<AuditRunResult> {
        const connection = connectionId
            ? await this.connectionService.findByIdForUser(userId, connectionId)
            : await this.getPrimaryConnection(userId);

        const integrationId = String(connection._id);
        const startResult = await this.auditRunService.startOrReturnActive(
            userId,
            integrationId,
            periodDays,
        );

        if (startResult.isExisting) {
            return {
                auditRunId: startResult.auditRunId,
                status: startResult.status,
                progressStep: startResult.progressStep,
            };
        }

        const auditRun = await this.auditRunService.findById(startResult.auditRunId);
        if (!auditRun) {
            throw new NotFoundException('Запуск аудита не найден');
        }

        const jobId = await this.queueProducer.enqueueAuditPipeline(
            integrationId,
            userId,
            startResult.auditRunId,
            auditRun.periodFrom,
            auditRun.periodTo,
            auditRun.periodDays as AuditPeriodDays,
        );

        await this.auditRunModel.updateOne(
            { _id: auditRun._id },
            { jobId },
        );

        await this.connectionAuditService.log({
            userId,
            connectionId: integrationId,
            action: OzonConnectionAuditAction.AUDIT_TRIGGERED,
            status: OzonConnectionAuditStatus.SUCCESS,
            summary: `auditRunId=${startResult.auditRunId}`,
        });

        return {
            auditRunId: startResult.auditRunId,
            status: startResult.status,
            progressStep: startResult.progressStep,
        };
    }

    async scheduleInitialAuditWithSync(
        userId: string,
        connectionId: string,
    ): Promise<AuditRunResult> {
        const startResult = await this.auditRunService.startOrReturnActive(
            userId,
            connectionId,
            30,
        );

        if (startResult.isExisting) {
            return {
                auditRunId: startResult.auditRunId,
                status: startResult.status,
                progressStep: startResult.progressStep,
            };
        }

        const auditRun = await this.auditRunService.findById(startResult.auditRunId);
        if (!auditRun) {
            throw new NotFoundException('Запуск аудита не найден');
        }

        const jobId = await this.queueProducer.enqueueInitialSyncWithAudit(
            connectionId,
            userId,
            startResult.auditRunId,
            auditRun.periodFrom,
            auditRun.periodTo,
            auditRun.periodDays as AuditPeriodDays,
        );

        await this.auditRunModel.updateOne({ _id: auditRun._id }, { jobId });

        return {
            auditRunId: startResult.auditRunId,
            status: startResult.status,
            progressStep: startResult.progressStep,
        };
    }

    async scheduleDailyAudit(
        userId: string,
        connectionId: string,
    ): Promise<void> {
        const active = await this.auditRunService.findActiveRun(userId, connectionId);
        if (active) {
            this.logger.log(
                `daily audit skipped userId=${userId} active auditRunId=${String(active._id)}`,
            );
            return;
        }

        const startResult = await this.auditRunService.startOrReturnActive(
            userId,
            connectionId,
            30,
        );

        const auditRun = await this.auditRunService.findById(startResult.auditRunId);
        if (!auditRun) {
            return;
        }

        const connection = await this.connectionService.findByIdForUser(
            userId,
            connectionId,
        );
        const skipSync = this.shouldSkipSyncForDailyAudit(connection.lastSyncAt);

        const jobId = await this.queueProducer.enqueueAuditPipeline(
            connectionId,
            userId,
            startResult.auditRunId,
            auditRun.periodFrom,
            auditRun.periodTo,
            auditRun.periodDays as AuditPeriodDays,
            'DAILY_CEO_REPORT',
            skipSync,
        );

        await this.auditRunModel.updateOne({ _id: auditRun._id }, { jobId });
    }

    async executeAuditStep(data: OzonAuditStepJobData): Promise<void> {
        const step = data.step as OzonAuditRunProgressStep;
        const auditRun = await this.auditRunService.findById(data.auditRunId);

        if (!auditRun) {
            throw new NotFoundException('Запуск аудита не найден');
        }

        if (
            auditRun.status === OzonAuditRunStatus.SUCCESS ||
            auditRun.status === OzonAuditRunStatus.PARTIAL_DATA ||
            auditRun.status === OzonAuditRunStatus.FAILED
        ) {
            return;
        }

        if (isAuditStepCompleted(auditRun.progressStep, step)) {
            const nextStep = getNextAuditStep(step);
            if (nextStep) {
                await this.queueProducer.enqueueAuditStep(data, nextStep);
            }
            return;
        }

        const firstStep = getFirstAuditStep(data.skipSync ?? false);
        if (step === firstStep && auditRun.status === OzonAuditRunStatus.QUEUED) {
            await this.auditRunService.markRunning(data.auditRunId);
        }

        const periodFrom = new Date(data.periodFrom);
        const periodTo = new Date(data.periodTo);
        const periodDays = data.periodDays;
        const reportType =
            data.reportType === 'DAILY_CEO_REPORT'
                ? OzonAiReportType.DAILY_CEO_REPORT
                : OzonAiReportType.INITIAL_AUDIT;

        try {
            await this.auditRunService.updateProgressStep(data.auditRunId, step);

            if (step === OzonAuditRunProgressStep.SYNC) {
                if (data.skipSync) {
                    const nextStep = getNextAuditStep(step);
                    if (nextStep) {
                        await this.queueProducer.enqueueAuditStep(data, nextStep);
                    }
                    return;
                }
                await this.sellerDataSyncService.syncAll(
                    data.connectionId,
                    data.userId,
                );
            }

            if (step === OzonAuditRunProgressStep.METRICS_BUILD) {
                await this.metricsBuilder.buildMetrics(data.userId, data.connectionId);
            }

            if (step === OzonAuditRunProgressStep.DATA_QUALITY) {
                const dataQuality = await this.dataQualityService.assess(
                    data.userId,
                    data.connectionId,
                    periodDays,
                );
                await this.auditRunService.saveDataQualitySnapshot(
                    data.auditRunId,
                    dataQuality,
                );
            }

            if (step === OzonAuditRunProgressStep.ISSUES_DETECT) {
                const dataQuality = await this.loadDataQualityForRun(data.auditRunId);
                await this.issueDetector.detectIssues(
                    data.userId,
                    data.connectionId,
                    dataQuality,
                    data.auditRunId,
                    periodFrom,
                    periodTo,
                    periodDays,
                );
            }

            if (step === OzonAuditRunProgressStep.RECOMMENDATIONS_BUILD) {
                const issues = await this.issueModel
                    .find({
                        userId: new Types.ObjectId(data.userId),
                        integrationId: new Types.ObjectId(data.connectionId),
                        auditRunId: new Types.ObjectId(data.auditRunId),
                    })
                    .exec();

                await this.recommendationBuilder.buildForIssues(
                    data.userId,
                    data.connectionId,
                    issues,
                    data.auditRunId,
                    periodFrom,
                    periodTo,
                );
            }

            if (step === OzonAuditRunProgressStep.AI_REPORT) {
                await this.finalizeAuditReport(
                    data,
                    periodFrom,
                    periodTo,
                    reportType,
                );
                return;
            }

            const nextStep = getNextAuditStep(step);
            if (nextStep) {
                await this.queueProducer.enqueueAuditStep(data, nextStep);
            }
        } catch (error) {
            const safeMessage = toSafeErrorMessage(error);
            await this.auditRunService.finalizeFailed(
                data.auditRunId,
                safeMessage,
                'AUDIT_PIPELINE_ERROR',
            );

            await this.connectionAuditService.log({
                userId: data.userId,
                connectionId: data.connectionId,
                action: OzonConnectionAuditAction.AUDIT_COMPLETED,
                status: OzonConnectionAuditStatus.FAILED,
                summary: `auditRunId=${data.auditRunId} error=${safeMessage}`,
            });

            throw error;
        }
    }

    private async finalizeAuditReport(
        data: OzonAuditStepJobData,
        periodFrom: Date,
        periodTo: Date,
        reportType: OzonAiReportType,
    ): Promise<void> {
        const refreshedRun = await this.auditRunService.findById(data.auditRunId);
        if (!refreshedRun) {
            throw new NotFoundException('Запуск аудита не найден');
        }

        const dataQuality = await this.loadDataQualityForRun(data.auditRunId);
        const issues = await this.issueModel
            .find({
                userId: new Types.ObjectId(data.userId),
                integrationId: new Types.ObjectId(data.connectionId),
                auditRunId: new Types.ObjectId(data.auditRunId),
            })
            .exec();
        const recommendations = await this.recommendationModel
            .find({
                userId: new Types.ObjectId(data.userId),
                integrationId: new Types.ObjectId(data.connectionId),
                auditRunId: new Types.ObjectId(data.auditRunId),
            })
            .exec();

        const context = await this.aiContextBuilder.buildContext(
            data.userId,
            data.connectionId,
            reportType,
            periodFrom,
            periodTo,
            dataQuality,
            refreshedRun,
            issues,
        );

        const { report: aiReport, usedLlm } = await this.aiAdvisor.generateReport(context);
        const aiText = this.aiAdvisor.formatReportText(aiReport);
        const modelName = usedLlm
            ? this.configService.get<string>('ozon.ai.model')
            : undefined;
        const promptVersion =
            this.configService.get<string>('ozon.audit.aiPromptVersion') ?? '1.0';

        const saved = await this.aiReportModel.create({
            userId: new Types.ObjectId(data.userId),
            integrationId: new Types.ObjectId(data.connectionId),
            auditRunId: new Types.ObjectId(data.auditRunId),
            periodFrom,
            periodTo,
            type: reportType,
            facts: this.buildFactsSummary(context),
            aiText,
            modelName,
            promptVersion,
        });

        await this.auditRunService.finalizeSuccess(
            data.auditRunId,
            dataQuality,
            issues,
            recommendations.length,
        );

        await this.connectionAuditService.log({
            userId: data.userId,
            connectionId: data.connectionId,
            action: OzonConnectionAuditAction.AUDIT_COMPLETED,
            status: OzonConnectionAuditStatus.SUCCESS,
            summary: `auditRunId=${data.auditRunId} issues=${String(issues.length)} reportId=${String(saved._id)} dataQuality=${String(dataQuality.score)}`,
        });

        await this.sendAuditAlert(
            data.userId,
            data.connectionId,
            context.summary,
            reportType,
        );

        this.logger.log(
            `audit completed auditRunId=${data.auditRunId} userId=${data.userId} issues=${String(issues.length)} dataQuality=${String(dataQuality.score)}`,
        );
    }
    async getAuditStatus(userId: string, connectionId?: string): Promise<AuditStatusView> {
        const connections = await this.connectionService.findAllByUser(userId);

        if (connections.length === 0) {
            return { state: OzonAuditUiState.NO_CONNECTION };
        }

        const resolvedConnectionId = connectionId ?? connections[0].id;
        const latestRun = await this.auditRunService.getLatestRun(
            userId,
            resolvedConnectionId,
        );

        if (!latestRun) {
            return { state: OzonAuditUiState.CONNECTED_NOT_AUDITED };
        }

        const auditRunView = this.auditRunService.toView(latestRun);
        const latestReport = await this.aiReportModel
            .findOne({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(resolvedConnectionId),
            })
            .sort({ createdAt: -1 })
            .exec();

        const latestReportId = latestReport ? String(latestReport._id) : undefined;

        if (
            latestRun.status === OzonAuditRunStatus.QUEUED ||
            latestRun.status === OzonAuditRunStatus.RUNNING
        ) {
            return {
                state: OzonAuditUiState.AUDIT_RUNNING,
                auditRun: auditRunView,
                latestReportId,
            };
        }

        if (latestRun.status === OzonAuditRunStatus.FAILED) {
            return {
                state: OzonAuditUiState.AUDIT_FAILED,
                auditRun: auditRunView,
                latestReportId,
            };
        }

        if (latestRun.status === OzonAuditRunStatus.PARTIAL_DATA) {
            return {
                state: OzonAuditUiState.PARTIAL_DATA,
                auditRun: auditRunView,
                latestReportId,
            };
        }

        return {
            state: OzonAuditUiState.AUDIT_READY,
            auditRun: auditRunView,
            latestReportId,
        };
    }

    async getLatestReport(
        userId: string,
        connectionId?: string,
    ): Promise<LatestAuditReportView> {
        const resolvedConnectionId = connectionId
            ? connectionId
            : String((await this.getPrimaryConnection(userId))._id);

        const latestRun = await this.auditRunService.getLatestRun(
            userId,
            resolvedConnectionId,
        );

        const report = await this.aiReportModel
            .findOne({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(resolvedConnectionId),
            })
            .sort({ createdAt: -1 })
            .exec();

        if (!report && !latestRun) {
            return {
                empty: true,
                message: 'Аудит ещё не выполнялся. Запустите первый Profit Audit.',
                topIssues: [],
                topRecommendations: [],
            };
        }

        const dataQuality = this.parseDataQualityFromRun(latestRun ?? undefined);

        const topIssues = await this.issueModel
            .find({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(resolvedConnectionId),
                status: {
                    $in: [
                        OzonDetectedIssueStatus.NEW,
                        OzonDetectedIssueStatus.VIEWED,
                    ],
                },
            })
            .sort({ detectedAt: -1 })
            .limit(5)
            .exec();

        const topRecommendations = await this.recommendationModel
            .find({
                userId: new Types.ObjectId(userId),
                integrationId: new Types.ObjectId(resolvedConnectionId),
                status: {
                    $in: [
                        OzonAuditRecommendationStatus.NEW,
                        OzonAuditRecommendationStatus.VIEWED,
                    ],
                },
            })
            .sort({ priority: 1, createdAt: -1 })
            .limit(5)
            .exec();

        return {
            report: report
                ? {
                      id: String(report._id),
                      auditRunId: report.auditRunId
                          ? String(report.auditRunId)
                          : undefined,
                      type: report.type,
                      aiText: report.aiText,
                      facts: report.facts,
                      createdAt: this.getDocCreatedAt(report) ?? new Date().toISOString(),
                  }
                : undefined,
            auditRun: latestRun ? this.auditRunService.toView(latestRun) : undefined,
            dataQuality,
            topIssues,
            topRecommendations,
            empty: !report,
            message: !report ? 'Отчёт ещё формируется или аудит не завершён.' : undefined,
        };
    }

    async listIssues(
        userId: string,
        filters: {
            connectionId?: string;
            status?: OzonDetectedIssueStatus;
            type?: string;
            severity?: string;
            limit?: number;
            page?: number;
            excludeResolved?: boolean;
        },
    ): Promise<{ items: OzonDetectedIssueDoc[]; total: number }> {
        const query: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
        };

        if (filters.connectionId) {
            query.integrationId = new Types.ObjectId(filters.connectionId);
        }

        if (filters.status) {
            query.status = filters.status;
        } else if (filters.excludeResolved) {
            query.status = {
                $in: [OzonDetectedIssueStatus.NEW, OzonDetectedIssueStatus.VIEWED],
            };
        }

        if (filters.type) {
            query.type = filters.type;
        }
        if (filters.severity) {
            query.severity = filters.severity;
        }

        const limit = filters.limit ?? 20;
        const page = filters.page ?? 1;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.issueModel
                .find(query)
                .sort({ detectedAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.issueModel.countDocuments(query).exec(),
        ]);

        return { items, total };
    }

    async getIssue(userId: string, issueId: string): Promise<{
        issue: OzonDetectedIssueDoc;
        recommendation: OzonAuditRecommendationDoc | null;
    }> {
        const issue = await this.issueModel.findOne({
            _id: new Types.ObjectId(issueId),
            userId: new Types.ObjectId(userId),
        });

        if (!issue) {
            throw new NotFoundException('Проблема не найдена');
        }

        const recommendation = await this.recommendationModel.findOne({
            issueId: issue._id,
            userId: new Types.ObjectId(userId),
        });

        return { issue, recommendation };
    }

    async updateIssueStatus(
        userId: string,
        issueId: string,
        status: OzonDetectedIssueStatus,
    ): Promise<OzonDetectedIssueDoc> {
        const issue = await this.issueModel.findOne({
            _id: new Types.ObjectId(issueId),
            userId: new Types.ObjectId(userId),
        });

        if (!issue) {
            throw new NotFoundException('Проблема не найдена');
        }

        issue.status = status;
        await issue.save();

        await this.syncRecommendationStatus(userId, issue, status);

        return issue;
    }

    async listAuditRecommendations(
        userId: string,
        connectionId?: string,
        status?: OzonAuditRecommendationStatus,
        activeOnly = false,
    ): Promise<OzonAuditRecommendationDoc[]> {
        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
        };

        if (connectionId) {
            filter.integrationId = new Types.ObjectId(connectionId);
        }

        if (status) {
            filter.status = status;
        } else if (activeOnly) {
            filter.status = {
                $in: [
                    OzonAuditRecommendationStatus.NEW,
                    OzonAuditRecommendationStatus.VIEWED,
                ],
            };
        }

        return this.recommendationModel
            .find(filter)
            .sort({ priority: 1, createdAt: -1 })
            .limit(100)
            .exec();
    }

    async getTopRecommendations(
        userId: string,
        limit = 3,
    ): Promise<OzonAuditRecommendationDoc[]> {
        return this.recommendationModel
            .find({
                userId: new Types.ObjectId(userId),
                status: {
                    $in: [
                        OzonAuditRecommendationStatus.NEW,
                        OzonAuditRecommendationStatus.VIEWED,
                    ],
                },
            })
            .sort({ priority: 1, createdAt: -1 })
            .limit(limit)
            .exec();
    }

    async updateRecommendationStatus(
        userId: string,
        recommendationId: string,
        status: OzonAuditRecommendationStatus,
    ): Promise<OzonAuditRecommendationDoc> {
        const recommendation = await this.recommendationModel.findOne({
            _id: new Types.ObjectId(recommendationId),
            userId: new Types.ObjectId(userId),
        });

        if (!recommendation) {
            throw new NotFoundException('Рекомендация не найдена');
        }

        recommendation.status = status;
        await recommendation.save();
        return recommendation;
    }

    private async syncRecommendationStatus(
        userId: string,
        issue: OzonDetectedIssueDoc,
        issueStatus: OzonDetectedIssueStatus,
    ): Promise<void> {
        const recStatusMap: Partial<
            Record<OzonDetectedIssueStatus, OzonAuditRecommendationStatus>
        > = {
            [OzonDetectedIssueStatus.VIEWED]: OzonAuditRecommendationStatus.VIEWED,
            [OzonDetectedIssueStatus.FIXED]: OzonAuditRecommendationStatus.DONE,
            [OzonDetectedIssueStatus.IGNORED]: OzonAuditRecommendationStatus.IGNORED,
        };

        const recStatus = recStatusMap[issueStatus];
        if (!recStatus) {
            return;
        }

        const filter: Record<string, unknown> = {
            userId: new Types.ObjectId(userId),
            issueId: issue._id,
        };

        if (issueStatus === OzonDetectedIssueStatus.VIEWED) {
            filter.status = OzonAuditRecommendationStatus.NEW;
        }

        await this.recommendationModel.updateOne(filter, { status: recStatus });
    }

    private async getPrimaryConnection(userId: string) {
        const connections = await this.connectionService.findAllByUser(userId);
        if (connections.length === 0) {
            throw new NotFoundException('Подключение Ozon не найдено');
        }
        return this.connectionService.findByIdForUser(userId, connections[0].id);
    }

    private getDocCreatedAt(doc: OzonAiReportDoc): string | undefined {
        const createdAt = doc.get('createdAt') as Date | undefined;
        return createdAt instanceof Date ? createdAt.toISOString() : undefined;
    }

    private shouldSkipSyncForDailyAudit(lastSyncAt?: Date): boolean {
        if (!lastSyncAt) {
            return false;
        }

        const skipSyncHours =
            this.configService.get<number>('ozon.audit.dailyAuditSkipSyncHours') ?? 6;
        const freshMs = skipSyncHours * 60 * 60 * 1000;
        return Date.now() - lastSyncAt.getTime() < freshMs;
    }

    private async sendAuditAlert(
        userId: string,
        connectionId: string,
        summary: RecommendationContext['summary'],
        reportType: OzonAiReportType,
    ): Promise<void> {
        const alertType =
            reportType === OzonAiReportType.INITIAL_AUDIT
                ? AlertEventType.INITIAL_AUDIT_COMPLETED
                : AlertEventType.DAILY_CEO_REPORT;

        const shortMessage =
            reportType === OzonAiReportType.INITIAL_AUDIT
                ? `AI-аудит Ozon завершен. Проблем: ${String(summary.totalIssues)}, критичных: ${String(summary.criticalIssues)}`
                : `Ежедневный отчёт Ozon: ${String(summary.totalIssues)} проблем`;

        await this.alertsService.createAlert({
            userId,
            type: alertType,
            severity: this.mapAuditSeverityToAlert(summary),
            connectionId,
            message: shortMessage,
            payload: { summary },
        });
    }

    private async loadDataQualityForRun(
        auditRunId: string,
    ): Promise<OzonAuditDataQuality> {
        const auditRun = await this.auditRunService.findById(auditRunId);
        const fromSnapshot = this.parseDataQualityFromRun(auditRun ?? undefined);
        if (fromSnapshot) {
            return fromSnapshot;
        }

        if (!auditRun) {
            throw new NotFoundException('Запуск аудита не найден');
        }

        return this.dataQualityService.assess(
            String(auditRun.userId),
            String(auditRun.integrationId),
            (auditRun.periodDays ?? 30) as AuditPeriodDays,
        );
    }

    private parseDataQualityFromRun(
        auditRun?: OzonAuditRunDoc,
    ): OzonAuditDataQuality | undefined {
        if (!auditRun?.dataQualitySnapshot) {
            return undefined;
        }

        const snapshot = auditRun.dataQualitySnapshot;
        if (typeof snapshot.score !== 'number') {
            return undefined;
        }

        return snapshot as unknown as OzonAuditDataQuality;
    }

    private buildFactsSummary(context: RecommendationContext): Record<string, unknown> {
        return {
            summary: context.summary,
            reportType: context.reportType,
            period: context.period,
            dataQuality: {
                score: context.dataQuality.score,
                state: context.dataQuality.state,
                warnings: context.dataQuality.warnings,
                missingDataCount: context.dataQuality.missingData.length,
            },
            issuesIncluded: context.issues.length,
            topIssues: context.issues.slice(0, 5).map((issue) => ({
                type: issue.type,
                severity: issue.severity,
                title: issue.title,
            })),
        };
    }

    private mapAuditSeverityToAlert(summary: {
        criticalIssues: number;
        highIssues: number;
    }): OzonSeverity {
        if (summary.criticalIssues > 0) {
            return OzonSeverity.CRITICAL;
        }
        if (summary.highIssues > 0) {
            return OzonSeverity.HIGH;
        }
        return OzonSeverity.MEDIUM;
    }
}
