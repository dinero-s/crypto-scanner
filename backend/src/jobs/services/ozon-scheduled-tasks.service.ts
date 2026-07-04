import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DistributedLockService } from 'src/common/redis/distributed-lock.service';
import { OzonConnectionService } from 'src/modules/ozon/integration/services/ozon-connection.service';
import { OzonAuditService } from 'src/modules/ozon/analytics/services/ozon-audit.service';
import { OzonQueueProducerService } from 'src/modules/ozon/queue/ozon-queue.producer.service';

/** Cron-автосинхронизация активных Ozon-подключений */
@Injectable()
export class OzonScheduledTasksService {
    private readonly logger = new Logger(OzonScheduledTasksService.name);

    constructor(
        private readonly connectionService: OzonConnectionService,
        private readonly auditService: OzonAuditService,
        private readonly ozonQueueProducer: OzonQueueProducerService,
        private readonly configService: ConfigService,
        private readonly distributedLock: DistributedLockService,
    ) {}

    /** Каждые 6 часов — постановка sync job для активных подключений */
    @Cron('0 */6 * * *')
    async enqueueActiveConnectionsSync(): Promise<void> {
        const jobEnable = this.configService.get<boolean>('app.jobEnable') === true;
        if (!jobEnable) {
            return;
        }

        const lockKey = this.ozonQueueProducer.getCronLockKey('sync');
        const lockTtl = this.ozonQueueProducer.getCronLockTtlMs();

        await this.distributedLock.withLock(lockKey, lockTtl, async () => {
            let queued = 0;

            for await (const connection of this.connectionService.iterateActiveConnections()) {
                await this.ozonQueueProducer.enqueueFullSync(
                    connection.id,
                    connection.userId,
                );
                queued += 1;
            }

            this.logger.log(`ozon cron queued sync jobs count=${String(queued)}`);
        });
    }

    /** Ежедневно в 07:00 UTC — Profit Audit + daily CEO report */
    @Cron('0 7 * * *')
    async enqueueDailyAuditPipeline(): Promise<void> {
        const jobEnable = this.configService.get<boolean>('app.jobEnable') === true;
        if (!jobEnable) {
            return;
        }

        const lockKey = this.ozonQueueProducer.getCronLockKey('daily-audit');
        const lockTtl = this.ozonQueueProducer.getCronLockTtlMs();

        await this.distributedLock.withLock(lockKey, lockTtl, async () => {
            let queued = 0;

            for await (const connection of this.connectionService.iterateActiveConnections()) {
                await this.auditService.scheduleDailyAudit(
                    connection.userId,
                    connection.id,
                );
                queued += 1;
            }

            this.logger.log(
                `ozon cron queued daily audit jobs count=${String(queued)}`,
            );
        });
    }
}
