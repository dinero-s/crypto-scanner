import { Injectable } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';
import { MarketDataRepository } from '../repositories/market-data.repository';
import { ExchangeHealthService } from './exchange-health.service';

/** Сбор open interest */
@Injectable()
export class OpenInterestService {
    constructor(
        private readonly registry: ExchangeRegistryService,
        private readonly repository: MarketDataRepository,
        private readonly healthService: ExchangeHealthService,
    ) {}

    /** Собрать open interest со всех включённых бирж */
    async collectAll(): Promise<number> {
        const items = await this.healthService.collectPerExchange(
            (exchange) => this.registry.getConnector(exchange).getOpenInterest(),
            'collectOpenInterest',
        );

        let saved = 0;
        for (const exchange of this.getUniqueExchanges(items)) {
            const exchangeItems = items.filter((i) => i.exchange === exchange);
            await this.repository.saveSnapshot(
                exchange,
                'open_interest',
                { items: exchangeItems },
                exchangeItems.length,
                Date.now(),
            );
            saved += exchangeItems.length;
        }

        return saved;
    }

    private getUniqueExchanges(
        items: Array<{ exchange: ExchangeEnum }>,
    ): ExchangeEnum[] {
        return [...new Set(items.map((i) => i.exchange))];
    }
}
