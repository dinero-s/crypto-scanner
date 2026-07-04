import { Global, Module } from '@nestjs/common';
import { DistributedLockService } from './distributed-lock.service';

/** Глобальный модуль Redis-блокировок для cron и idempotent операций */
@Global()
@Module({
    providers: [DistributedLockService],
    exports: [DistributedLockService],
})
export class RedisLockModule {}
