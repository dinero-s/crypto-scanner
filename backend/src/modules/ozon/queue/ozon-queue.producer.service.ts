import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    OZON_CRON_LOCK_TTL_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { OzonAuditRunProgressStep } from '../constants/ozon.enums';
import {
    OzonAuditPipelineJobData,
    OzonAuditStepJobData,
    OzonCompetitorSyncJobData,
    OzonCompetitorsBulkSyncJobData,
    OzonSyncJobData,
} from './interfaces/ozon-queue.interface';
import { getFirstAuditStep } from '../analytics/utils/audit-pipeline.utils';

/** Producer очередей синхронизации, аудита и конкурентов Ozon */
@Injectable()
export class OzonQueueProducerService {
    private readonly logger = new Logger(OzonQueueProducerService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.OZON_SYNC)
        private readonly syncQueue: Queue<OzonSyncJobData | OzonAuditPipelineJobData>,
        @InjectQueue(QUEUE_NAMES.OZON_AUDIT)
        private readonly auditQueue: Queue<OzonAuditStepJobData>,
        @InjectQueue(QUEUE_NAMES.OZON_COMPETITOR)
        private readonly competitorQueue: Queue<
            OzonCompetitorSyncJobData | OzonCompetitorsBulkSyncJobData
        >,
    ) {}

    async enqueueFullSync(connectionId: string, userId: string): Promise<void> {
        const jobId = `ozon:sync:full:${connectionId}`;

        if (await this.isActiveJob(this.syncQueue, jobId)) {
            this.logger.log(`jobId=${jobId} уже в очереди, пропуск`);
            return;
        }

        await this.syncQueue.add(
            QUEUE_JOB_NAMES.SYNC_OZON_FULL,
            { connectionId, userId, syncType: 'full' },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );

        this.logger.log(`jobId=${jobId} поставлен в очередь`);
    }

    async enqueueCompetitorSync(
        competitorId: string,
        userId: string,
    ): Promise<void> {
        const jobId = `ozon:competitor:${competitorId}`;

        if (await this.isActiveJob(this.competitorQueue, jobId)) {
            this.logger.log(`jobId=${jobId} уже в очереди, пропуск`);
            return;
        }

        await this.competitorQueue.add(
            QUEUE_JOB_NAMES.SYNC_COMPETITOR_OFFICIAL_STATS,
            { competitorId, userId },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );

        this.logger.log(`jobId=${jobId} поставлен в очередь`);
    }

    async enqueueAuditPipeline(
        connectionId: string,
        userId: string,
        auditRunId: string,
        periodFrom: Date,
        periodTo: Date,
        periodDays: 30 | 60 | 90,
        reportType: 'INITIAL_AUDIT' | 'DAILY_CEO_REPORT' = 'INITIAL_AUDIT',
        skipSync = false,
    ): Promise<string> {
        const pipelineData: OzonAuditPipelineJobData = {
            connectionId,
            userId,
            auditRunId,
            periodFrom: periodFrom.toISOString(),
            periodTo: periodTo.toISOString(),
            periodDays,
            reportType,
            skipSync,
        };

        const firstStep = getFirstAuditStep(skipSync);
        return this.enqueueAuditStep(pipelineData, firstStep);
    }

    async enqueueAuditStep(
        pipelineData: OzonAuditPipelineJobData,
        step: OzonAuditRunProgressStep,
    ): Promise<string> {
        const jobId = `ozon:audit:${pipelineData.auditRunId}:${step}`;

        if (await this.isActiveJob(this.auditQueue, jobId)) {
            this.logger.log(`jobId=${jobId} уже в очереди, пропуск`);
            return jobId;
        }

        await this.auditQueue.add(
            QUEUE_JOB_NAMES.OZON_AUDIT_STEP,
            { ...pipelineData, step },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );

        this.logger.log(`jobId=${jobId} audit step=${step} поставлен в очередь`);
        return jobId;
    }

    async enqueueInitialSyncWithAudit(
        connectionId: string,
        userId: string,
        auditRunId: string,
        periodFrom: Date,
        periodTo: Date,
        periodDays: 30 | 60 | 90,
    ): Promise<string> {
        const jobId = `ozon:initial:${auditRunId}`;

        if (await this.isActiveJob(this.syncQueue, jobId)) {
            this.logger.log(`jobId=${jobId} уже в очереди, пропуск`);
            return jobId;
        }

        await this.syncQueue.add(
            QUEUE_JOB_NAMES.OZON_INITIAL_SYNC,
            {
                connectionId,
                userId,
                auditRunId,
                periodFrom: periodFrom.toISOString(),
                periodTo: periodTo.toISOString(),
                periodDays,
            },
            { ...DEFAULT_QUEUE_JOB_OPTIONS, jobId },
        );

        this.logger.log(`jobId=${jobId} initial sync+audit поставлен в очередь`);
        return jobId;
    }

    /** Ключ cron lock для распределённого выполнения */
    getCronLockKey(taskName: string): string {
        return `ozon:cron:${taskName}`;
    }

    /** TTL cron lock */
    getCronLockTtlMs(): number {
        return OZON_CRON_LOCK_TTL_MS;
    }

    private async isActiveJob(
        queue: Queue,
        jobId: string,
    ): Promise<boolean> {
        const existing = await queue.getJob(jobId);
        if (!existing) {
            return false;
        }

        const state = await existing.getState();
        return state === 'waiting' || state === 'active' || state === 'delayed';
    }
}
