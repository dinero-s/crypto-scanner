import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import {
    OZON_QUEUE_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import {
    OzonCompetitorSyncJobData,
    OzonSyncJobData,
    OzonAuditStepJobData,
} from 'src/modules/ozon/queue/interfaces/ozon-queue.interface';
import { UsersEntity, UsersDoc } from 'src/modules/users/entities/users.entity';
import {
    OzonConnectionEntity,
    OzonConnectionDoc,
} from 'src/modules/ozon/integration/entities/ozon-connection.entity';
import { AuditAction } from 'src/modules/audit-log/enums/audit-action.enum';
import { AdminJobStatus, MarketplaceType } from '../enums/admin-panel.enum';
import {
    AdminJobDetailDto,
    AdminJobListItemDto,
    FilterAdminJobsDto,
} from '../dto/admin-job.dto';
import { sanitizeRecord } from '../utils/sanitize.util';
import {
    AdminAuditContext,
    AdminAuditWriterService,
} from './admin-audit-writer.service';

type AdminJobData =
    | OzonSyncJobData
    | OzonCompetitorSyncJobData
    | OzonAuditStepJobData;

/** Admin API для BullMQ jobs */
@Injectable()
export class AdminJobsService {
    constructor(
        @InjectQueue(QUEUE_NAMES.OZON_SYNC)
        private readonly syncQueue: Queue<AdminJobData>,
        @InjectQueue(QUEUE_NAMES.OZON_AUDIT)
        private readonly auditQueue: Queue<AdminJobData>,
        @InjectQueue(QUEUE_NAMES.OZON_COMPETITOR)
        private readonly competitorQueue: Queue<AdminJobData>,
        @DatabaseModel(UsersEntity.name)
        private readonly usersModel: Model<UsersDoc>,
        @DatabaseModel(OzonConnectionEntity.name)
        private readonly connectionModel: Model<OzonConnectionDoc>,
        private readonly auditWriter: AdminAuditWriterService,
    ) {}

    async findAll(filter: FilterAdminJobsDto): Promise<{
        data: AdminJobListItemDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const states = ['waiting', 'active', 'completed', 'failed', 'delayed'] as const;
        const queues = this.getQueuesForFilter(filter.queue);
        const allJobs: Array<{ job: Job; queueName: string }> = [];

        for (const { queue, queueName } of queues) {
            const jobs = await queue.getJobs([...states], 0, 500);
            for (const job of jobs) {
                allJobs.push({ job, queueName });
            }
        }

        const filtered = allJobs.filter(({ job }) => this.matchesFilter(job, filter));
        filtered.sort((a, b) => (b.job.timestamp ?? 0) - (a.job.timestamp ?? 0));

        const total = filtered.length;
        const start = (page - 1) * limit;
        const slice = filtered.slice(start, start + limit);
        const data = await Promise.all(
            slice.map(({ job, queueName }) => this.toListItem(job, queueName)),
        );

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async findOne(id: string): Promise<AdminJobDetailDto> {
        const located = await this.findJobAcrossQueues(id);
        if (!located) {
            throw new NotFoundException('Job не найден');
        }
        const listItem = await this.toListItem(located.job, located.queueName);
        return {
            ...listItem,
            sanitizedData: sanitizeRecord(
                located.job.data as unknown as Record<string, unknown>,
            ),
            stacktrace: located.job.stacktrace,
        };
    }

    async retry(id: string, ctx: AdminAuditContext): Promise<{ message: string }> {
        const located = await this.findJobAcrossQueues(id);
        if (!located) {
            throw new NotFoundException('Job не найден');
        }
        const status = this.mapJobStatus(located.job);
        if (status !== AdminJobStatus.FAILED) {
            throw new BadRequestException('Retry доступен только для FAILED jobs');
        }
        await located.job.retry();
        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_RETRIED_JOB,
            'jobs',
            id,
            `Admin retry job ${id}`,
        );
        return { message: 'Job поставлен на retry' };
    }

    async cancel(id: string, ctx: AdminAuditContext): Promise<{ message: string }> {
        const located = await this.findJobAcrossQueues(id);
        if (!located) {
            throw new NotFoundException('Job не найден');
        }
        const status = this.mapJobStatus(located.job);
        if (status !== AdminJobStatus.WAITING && status !== AdminJobStatus.DELAYED) {
            throw new BadRequestException('Cancel доступен только для WAITING/DELAYED jobs');
        }
        await located.job.remove();
        await this.auditWriter.log(
            ctx,
            AuditAction.ADMIN_CANCELLED_JOB,
            'jobs',
            id,
            `Admin cancelled job ${id}`,
        );
        return { message: 'Job отменён' };
    }

    private getQueuesForFilter(
        queueFilter?: string,
    ): Array<{ queue: Queue<AdminJobData>; queueName: string }> {
        const all = [
            { queue: this.syncQueue, queueName: QUEUE_NAMES.OZON_SYNC },
            { queue: this.auditQueue, queueName: QUEUE_NAMES.OZON_AUDIT },
            { queue: this.competitorQueue, queueName: QUEUE_NAMES.OZON_COMPETITOR },
        ];

        if (!queueFilter) {
            return all;
        }

        return all.filter((item) => item.queueName === queueFilter);
    }

    private async findJobAcrossQueues(
        id: string,
    ): Promise<{ job: Job; queueName: string } | null> {
        for (const { queue, queueName } of this.getQueuesForFilter()) {
            const job = await queue.getJob(id);
            if (job) {
                return { job, queueName };
            }
        }
        return null;
    }

    private matchesFilter(job: Job, filter: FilterAdminJobsDto): boolean {
        if (
            filter.queue &&
            !OZON_QUEUE_NAMES.includes(
                filter.queue as (typeof OZON_QUEUE_NAMES)[number],
            )
        ) {
            return false;
        }
        if (filter.status && this.mapJobStatus(job) !== filter.status) {
            return false;
        }
        if (filter.jobType && job.name !== filter.jobType) {
            return false;
        }
        const data = job.data as AdminJobData;
        if (filter.userId && data.userId !== filter.userId) {
            return false;
        }
        if (
            filter.connectionId &&
            'connectionId' in data &&
            data.connectionId !== filter.connectionId
        ) {
            return false;
        }
        if (filter.marketplace && filter.marketplace !== MarketplaceType.OZON) {
            return false;
        }
        if (filter.dateFrom || filter.dateTo) {
            const ts = job.timestamp ?? 0;
            if (filter.dateFrom && ts < new Date(filter.dateFrom).getTime()) {
                return false;
            }
            if (filter.dateTo && ts > new Date(filter.dateTo).getTime()) {
                return false;
            }
        }
        return true;
    }

    private async toListItem(
        job: Job,
        queueName: string,
    ): Promise<AdminJobListItemDto> {
        const data = job.data as AdminJobData;
        const user = data.userId
            ? await this.usersModel.findById(data.userId).select('email').lean().exec()
            : null;

        let connectionName: string | undefined;
        if ('connectionId' in data && data.connectionId) {
            const connection = await this.connectionModel
                .findById(data.connectionId)
                .select('sellerName')
                .lean()
                .exec();
            connectionName = connection?.sellerName;
        }

        const startedAt = job.processedOn ?? job.timestamp;
        const finishedAt = job.finishedOn;
        const durationMs =
            startedAt && finishedAt ? finishedAt - startedAt : undefined;

        return {
            id: job.id ?? '',
            queue: queueName,
            marketplace: MarketplaceType.OZON,
            userId: data.userId,
            userEmail: String(user?.email ?? ''),
            connectionId: 'connectionId' in data ? data.connectionId : undefined,
            connectionName,
            jobType: job.name,
            status: this.mapJobStatus(job),
            attemptsMade: job.attemptsMade,
            maxAttempts: job.opts.attempts ?? 3,
            startedAt: startedAt ? new Date(startedAt).toISOString() : undefined,
            finishedAt: finishedAt ? new Date(finishedAt).toISOString() : undefined,
            durationMs,
            errorMessage: job.failedReason,
        };
    }

    private mapJobStatus(job: Job): AdminJobStatus {
        if (job.finishedOn && job.failedReason) {
            return AdminJobStatus.FAILED;
        }
        if (job.finishedOn && !job.failedReason) {
            return AdminJobStatus.COMPLETED;
        }
        if (job.processedOn && !job.finishedOn) {
            return AdminJobStatus.ACTIVE;
        }
        if (job.delay && job.delay > 0 && !job.processedOn) {
            return AdminJobStatus.DELAYED;
        }
        if (job.attemptsMade > 0 && !job.finishedOn) {
            return AdminJobStatus.RETRYING;
        }
        if (!job.processedOn) {
            return AdminJobStatus.WAITING;
        }
        return AdminJobStatus.WAITING;
    }
}
