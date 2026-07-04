import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { MarketDataRepository } from '../repositories/market-data.repository';
import { ExchangeHealthService } from './exchange-health.service';
import { MarketDataCacheService } from './market-data-cache.service';

/** Сбор spot-тикеров */
@Injectable()
export class SpotPriceService {
    private readonly logger = new Logger(SpotPriceService.name);

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

        this.logger.log(`collectSpotTickers saved=${String(saved)} total=${String(tickers.length)}`);
        return saved;
    }

    /** Собрать spot-цену для символа на бирже (legacy) */
    async collectSpot(exchange: ExchangeEnum, unifiedSymbol: string): Promise<void> {
        const connector = this.registry.getConnector(exchange);
        const tickers = await connector.getSpotTickers();
        const ticker = tickers.find((item) => item.symbol === unifiedSymbol);

        this.logger.debug(
            `collectSpot: ${exchange}/${unifiedSymbol} found=${String(Boolean(ticker))}`,
        );
    }

    private getUniqueExchanges(
        tickers: Array<{ exchange: ExchangeEnum }>,
    ): ExchangeEnum[] {
        return [...new Set(tickers.map((t) => t.exchange))];
    }
}
