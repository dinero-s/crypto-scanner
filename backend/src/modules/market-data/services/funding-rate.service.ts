import { Injectable } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { MarketDataRepository } from '../repositories/market-data.repository';
import { ExchangeHealthService } from './exchange-health.service';
import { MarketDataCacheService } from './market-data-cache.service';

/** Сбор funding rates */
@Injectable()
export class FundingRateService {
    constructor(
        private readonly registry: ExchangeRegistryService,
        private readonly repository: MarketDataRepository,
        private readonly cacheService: MarketDataCacheService,
        private readonly healthService: ExchangeHealthService,
    ) {}

    /** Собрать funding rates со всех включённых бирж */
    async collectAll(): Promise<number> {
        const rates = await this.healthService.collectPerExchange(
            (exchange) => this.registry.getConnector(exchange).getFundingRates(),
            'collectFundingRates',
        );

        const saved = await this.repository.insertFundingRates(rates);
        await this.cacheService.setLatestFunding(rates);

        for (const exchange of this.getUniqueExchanges(rates)) {
            const exchangeRates = rates.filter((r) => r.exchange === exchange);
            await this.repository.saveSnapshot(
                exchange,
                'funding',
                { rates: exchangeRates },
                exchangeRates.length,
                Date.now(),
            );
        }

        return saved;
    }

    private getUniqueExchanges(
        rates: Array<{ exchange: ExchangeEnum }>,
    ): ExchangeEnum[] {
        return [...new Set(rates.map((r) => r.exchange))];
    }
}
