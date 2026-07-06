import { Injectable } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { MarketDataRepository } from '../repositories/market-data.repository';
import { ExchangeHealthService } from './exchange-health.service';
import { MarketDataCacheService } from './market-data-cache.service';

/** Сбор perpetual-тикеров */
@Injectable()
export class FuturesPriceService {
    constructor(
        private readonly registry: ExchangeRegistryService,
        private readonly repository: MarketDataRepository,
        private readonly cacheService: MarketDataCacheService,
        private readonly healthService: ExchangeHealthService,
    ) {}

    /** Собрать perp-тикеры со всех включённых бирж */
    async collectAll(): Promise<number> {
        const tickers = await this.healthService.collectPerExchange(
            (exchange) => this.registry.getConnector(exchange).getPerpTickers(),
            'collectPerpTickers',
        );

        const saved = await this.repository.insertPerpTickers(tickers);
        await this.cacheService.setLatestPerp(tickers);

        for (const exchange of this.getUniqueExchanges(tickers)) {
            const exchangeTickers = tickers.filter((t) => t.exchange === exchange);
            await this.repository.saveSnapshot(
                exchange,
                'perp',
                { tickers: exchangeTickers },
                exchangeTickers.length,
                Date.now(),
            );
        }

        return saved;
    }

    private getUniqueExchanges(
        tickers: Array<{ exchange: ExchangeEnum }>,
    ): ExchangeEnum[] {
        return [...new Set(tickers.map((t) => t.exchange))];
    }
}
