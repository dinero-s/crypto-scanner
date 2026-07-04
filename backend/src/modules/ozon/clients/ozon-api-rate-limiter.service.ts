import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Проактивный rate limiter Ozon API per clientId через Redis */
@Injectable()
export class OzonApiRateLimiterService implements OnModuleDestroy {
    private readonly logger = new Logger(OzonApiRateLimiterService.name);
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

    /** Ожидание слота перед HTTP-запросом к Ozon */
    async acquire(rateLimitKey: string): Promise<void> {
        const intervalMs =
            this.configService.get<number>('ozon.api.minRequestIntervalMs') ?? 250;
        const key = `ozon:api:slot:${rateLimitKey}`;
        const maxWaitMs = intervalMs * 20;
        const startedAt = Date.now();

        while (Date.now() - startedAt < maxWaitMs) {
            const acquired = await this.tryAcquire(key, intervalMs);
            if (acquired) {
                return;
            }
            await this.sleep(intervalMs);
        }

        this.logger.warn(`rate limit wait timeout key=${rateLimitKey}`);
    }

    private async tryAcquire(key: string, intervalMs: number): Promise<boolean> {
        const script = `
            local now = tonumber(ARGV[1])
            local interval = tonumber(ARGV[2])
            local last = redis.call("GET", KEYS[1])
            if last then
                local elapsed = now - tonumber(last)
                if elapsed < interval then
                    return 0
                end
            end
            redis.call("SET", KEYS[1], now, "PX", interval * 4)
            return 1
        `;

        const result = await this.redis.eval(
            script,
            1,
            key,
            String(Date.now()),
            String(intervalMs),
        );

        return Number(result) === 1;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
