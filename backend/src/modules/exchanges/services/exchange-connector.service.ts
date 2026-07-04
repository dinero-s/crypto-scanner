import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum } from '../enums/exchange.enum';
import { ExchangeMarketDataConnector } from '../interfaces/exchange-market-data-connector.interface';
import {
    NormalizedFundingRate,
    NormalizedInstrument,
    NormalizedOpenInterest,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from '../interfaces/normalized-market-data.interface';
import { ExchangeRegistryService } from './exchange-registry.service';

/** Оркестратор: partial results при недоступности отдельных бирж */
@Injectable()
export class ExchangeConnectorService {
    private readonly logger = new Logger(ExchangeConnectorService.name);

    constructor(private readonly registry: ExchangeRegistryService) {}

    async getSpotTickers(
        exchanges?: ExchangeEnum[],
    ): Promise<NormalizedSpotTicker[]> {
        return this.collectPartial(
            exchanges ?? this.registry.getSupportedExchanges(),
            (connector) => connector.getSpotTickers(),
            'getSpotTickers',
        );
    }

    async getPerpTickers(
        exchanges?: ExchangeEnum[],
    ): Promise<NormalizedPerpTicker[]> {
        return this.collectPartial(
            exchanges ?? this.registry.getSupportedExchanges(),
            (connector) => connector.getPerpTickers(),
            'getPerpTickers',
        );
    }

    async getFundingRates(
        exchanges?: ExchangeEnum[],
    ): Promise<NormalizedFundingRate[]> {
        return this.collectPartial(
            exchanges ?? this.registry.getSupportedExchanges(),
            (connector) => connector.getFundingRates(),
            'getFundingRates',
        );
    }

    async getOpenInterest(
        exchanges?: ExchangeEnum[],
    ): Promise<NormalizedOpenInterest[]> {
        return this.collectPartial(
            exchanges ?? this.registry.getSupportedExchanges(),
            (connector) => connector.getOpenInterest(),
            'getOpenInterest',
        );
    }

    async getInstruments(
        exchanges?: ExchangeEnum[],
    ): Promise<NormalizedInstrument[]> {
        return this.collectPartial(
            exchanges ?? this.registry.getSupportedExchanges(),
            (connector) => connector.getInstruments(),
            'getInstruments',
        );
    }

    async getHealthStatus(): Promise<Record<ExchangeEnum, boolean>> {
        const entries = await Promise.all(
            this.registry.getAllConnectors().map(async (connector) => {
                const healthy = await connector.isHealthy();
                return [connector.getExchangeName(), healthy] as const;
            }),
        );

        return Object.fromEntries(entries) as Record<ExchangeEnum, boolean>;
    }

    private async collectPartial<T>(
        exchanges: ExchangeEnum[],
        fetcher: (connector: ExchangeMarketDataConnector) => Promise<T[]>,
        method: string,
    ): Promise<T[]> {
        const results = await Promise.all(
            exchanges.map(async (exchange) => {
                try {
                    const connector = this.registry.getConnector(exchange);
                    return await fetcher(connector);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'unknown error';
                    this.logger.error(
                        `exchange=${exchange} method=${method} message=${message}`,
                    );
                    return [] as T[];
                }
            }),
        );

        return results.flat();
    }
}
