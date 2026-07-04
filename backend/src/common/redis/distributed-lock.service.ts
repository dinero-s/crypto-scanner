import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

/** Распределённая блокировка через Redis SET NX */
@Injectable()
export class DistributedLockService implements OnModuleDestroy {
    private readonly logger = new Logger(DistributedLockService.name);
    private readonly redis: Redis;

    constructor(private readonly configService: ConfigService) {
        this.redis = new Redis({
            host: this.configService.get<string>('redis.host') ?? 'localhost',
            port: this.configService.get<number>('redis.port') ?? 6379,
            password: this.configService.get<string>('redis.password'),
            db: this.configService.get<number>('redis.db') ?? 0,
            maxRetriesPerRequest: 2,
        });
    }

    onModuleDestroy(): void {
        this.redis.disconnect();
    }

    /** Выполнить fn под lock; false если lock не получен */
    async withLock(
        key: string,
        ttlMs: number,
        fn: () => Promise<void>,
    ): Promise<boolean> {
        const token = randomUUID();
        const lockKey = `lock:${key}`;
        const acquired = await this.redis.set(lockKey, token, 'PX', ttlMs, 'NX');

        if (acquired !== 'OK') {
            this.logger.log(`lock skipped key=${lockKey}`);
            return false;
        }

        try {
            await fn();
            return true;
        } finally {
            await this.releaseLock(lockKey, token);
        }
    }

    private async releaseLock(lockKey: string, token: string): Promise<void> {
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;

        try {
            await this.redis.eval(script, 1, lockKey, token);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`lock release failed key=${lockKey} error=${message}`);
        }
    }
}
