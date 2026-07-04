import { Injectable } from '@nestjs/common';
import { ExchangeEnum } from '../enums/exchange.enum';

/** In-memory rate limit guard per бирже */
@Injectable()
export class ExchangeRateLimiterService {
    private readonly lastRequestAt = new Map<ExchangeEnum, number>();

    /** Ждёт минимальный интервал между запросами к бирже */
    async acquire(exchange: ExchangeEnum, intervalMs: number): Promise<void> {
        const now = Date.now();
        const lastAt = this.lastRequestAt.get(exchange) ?? 0;
        const waitMs = intervalMs - (now - lastAt);

        if (waitMs > 0) {
            await this.sleep(waitMs);
        }

        this.lastRequestAt.set(exchange, Date.now());
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
