import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeEnum } from '../enums/exchange.enum';
import { ExchangeApiError } from '../errors/exchange-api.error';
import { ExchangeMarketDataConnector } from '../interfaces/exchange-market-data-connector.interface';
import {
    NormalizedFundingRate,
    NormalizedInstrument,
    NormalizedOpenInterest,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from '../interfaces/normalized-market-data.interface';
import { ExchangeHttpService } from '../services/exchange-http.service';

/** Базовый connector: общая обработка ошибок и partial results */
export abstract class BaseExchangeConnector implements ExchangeMarketDataConnector {
    protected readonly logger = new Logger(this.constructor.name);

    constructor(
        protected readonly exchange: ExchangeEnum,
        protected readonly http: ExchangeHttpService,
        protected readonly configService: ConfigService,
    ) {}

    getExchangeName(): ExchangeEnum {
        return this.exchange;
    }

    async getSpotTickers(): Promise<NormalizedSpotTicker[]> {
        return this.safeFetch('getSpotTickers', () => this.fetchSpotTickers());
    }

    async getPerpTickers(): Promise<NormalizedPerpTicker[]> {
        return this.safeFetch('getPerpTickers', () => this.fetchPerpTickers());
    }

    async getFundingRates(): Promise<NormalizedFundingRate[]> {
        return this.safeFetch('getFundingRates', () => this.fetchFundingRates());
    }

    async getOpenInterest(): Promise<NormalizedOpenInterest[]> {
        return this.safeFetch('getOpenInterest', () => this.fetchOpenInterest());
    }

    async getInstruments(): Promise<NormalizedInstrument[]> {
        return this.safeFetch('getInstruments', () => this.fetchInstruments());
    }

    protected abstract fetchSpotTickers(): Promise<NormalizedSpotTicker[]>;

    protected abstract fetchPerpTickers(): Promise<NormalizedPerpTicker[]>;

    protected abstract fetchFundingRates(): Promise<NormalizedFundingRate[]>;

    protected abstract fetchOpenInterest(): Promise<NormalizedOpenInterest[]>;

    protected abstract fetchInstruments(): Promise<NormalizedInstrument[]>;

    protected abstract ping(): Promise<void>;

    async isHealthy(): Promise<boolean> {
        try {
            await this.ping();
            return true;
        } catch (error) {
            const message =
                error instanceof ExchangeApiError ? error.message : 'health check failed';
            this.logger.warn(`exchange=${this.exchange} isHealthy=false message=${message}`);
            return false;
        }
    }

    protected getConfigUrl(key: string, fallback: string): string {
        const value = this.configService.get<string>(`exchanges.${key}`);
        return value ?? fallback;
    }

    private async safeFetch<T>(
        method: string,
        fetcher: () => Promise<T[]>,
    ): Promise<T[]> {
        try {
            return await fetcher();
        } catch (error) {
            const apiError =
                error instanceof ExchangeApiError
                    ? error
                    : new ExchangeApiError(
                          this.exchange,
                          method,
                          error instanceof Error ? error.message : 'unknown error',
                          undefined,
                          error,
                      );

            this.logger.error(
                `exchange=${this.exchange} method=${method} statusCode=${String(apiError.statusCode ?? 'n/a')} message=${apiError.message}`,
            );
            return [];
        }
    }
}
