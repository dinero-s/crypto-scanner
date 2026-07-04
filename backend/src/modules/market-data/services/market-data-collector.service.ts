import { Injectable, Logger } from '@nestjs/common';
import { CollectMarketDataDto } from '../dto/collect-market-data.dto';

/** Оркестратор сбора market data со всех бирж */
@Injectable()
export class MarketDataCollectorService {
    private readonly logger = new Logger(MarketDataCollectorService.name);

    /** Запустить полный цикл сбора */
    async collectAll(dto: CollectMarketDataDto): Promise<void> {
        this.logger.log(
            `collectAll: exchanges=${dto.exchanges.length} symbols=${dto.symbols.length}`,
        );
    }

    /** Статус последнего сбора */
    async getCollectorStatus(): Promise<{ lastRunAt: string | null; healthy: boolean }> {
        return { lastRunAt: null, healthy: true };
    }
}
