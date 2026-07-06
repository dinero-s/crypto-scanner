import { Injectable } from '@nestjs/common';
import { MarketDataCollectorService } from 'src/modules/market-data/services/market-data-collector.service';

/** Health: состояние scanner collectors */
@Injectable()
export class ScannerHealthService {
    constructor(private readonly marketDataCollector: MarketDataCollectorService) {}

    /** Статус collectors для readiness */
    async getCollectorsHealth(): Promise<{
        healthy: boolean;
        lastRunAt: string | null;
        details: Record<string, string>;
    }> {
        const status = await this.marketDataCollector.getCollectorStatus();
        return {
            healthy: status.healthy,
            lastRunAt: status.lastRunAt,
            details: {
                marketData: status.healthy ? 'ok' : 'degraded',
            },
        };
    }
}
