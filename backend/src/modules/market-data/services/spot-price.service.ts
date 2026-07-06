import { Injectable } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { MarketDataRepository } from '../repositories/market-data.repository';
import { ExchangeHealthService } from './exchange-health.service';
import { MarketDataCacheService } from './market-data-cache.service';

/** Сбор spot-тикеров */
@Injectable()
export class SpotPriceService {
    constructor(
        private readonly registry: ExchangeRegistryService,
        private readonly repository: MarketDataRepository,
        private readonly cacheService: MarketDataCacheService,
        private readonly healthService: ExchangeHealthService,
    ) {}

    /** Собрать spot-тикеры со всех включённых бирж */
    async collectAll(): Promise<number> {
        const tickers = await this.healthService.collectPerExchange(
            (exchange) => this.registry.getConnector(exchange).getSpotTickers(),
            'collectSpotTickers',
        );

        const saved = await this.repository.insertSpotTickers(tickers);
        await this.cacheService.setLatestSpot(tickers);

        for (const exchange of this.getUniqueExchanges(tickers)) {
            const exchangeTickers = tickers.filter((t) => t.exchange === exchange);
            await this.repository.saveSnapshot(
                exchange,
                'spot',
                { tickers: exchangeTickers },
                exchangeTickers.length,
                Date.now(),
            );
        }

        return saved;
    }

    /** Собрать spot-цену для символа на бирже (legacy) */
    async collectSpot(exchange: ExchangeEnum, _unifiedSymbol: string): Promise<void> {
        const connector = this.registry.getConnector(exchange);
        await connector.getSpotTickers();
    }

    private getUniqueExchanges(
        tickers: Array<{ exchange: ExchangeEnum }>,
    ): ExchangeEnum[] {
        return [...new Set(tickers.map((t) => t.exchange))];
    }
}
