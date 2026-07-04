import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeEnum } from '../../enums/exchange.enum';
import {
    NormalizedFundingRate,
    NormalizedInstrument,
    NormalizedOpenInterest,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from '../../interfaces/normalized-market-data.interface';
import { ExchangeHttpService } from '../../services/exchange-http.service';
import { BaseExchangeConnector } from '../base-exchange.connector';
import {
    BybitApiResponse,
    BybitInstrumentItem,
    BybitTickerItem,
    normalizeBybitFundingRates,
    normalizeBybitInstruments,
    normalizeBybitOpenInterest,
    normalizeBybitPerpTickers,
    normalizeBybitSpotTickers,
} from './bybit.normalizer';

/** Bybit V5 public market data connector */
@Injectable()
export class BybitConnector extends BaseExchangeConnector {
    constructor(http: ExchangeHttpService, configService: ConfigService) {
        super(ExchangeEnum.BYBIT, http, configService);
    }

    protected async fetchSpotTickers(): Promise<NormalizedSpotTicker[]> {
        const baseUrl = this.getConfigUrl('bybitRestUrl', 'https://api.bybit.com');
        const response = await this.http.get<BybitApiResponse<{ list: BybitTickerItem[] }>>(
            this.exchange,
            `${baseUrl}/v5/market/tickers`,
            { category: 'spot' },
        );

        return normalizeBybitSpotTickers(response.result.list, response.time);
    }

    protected async fetchPerpTickers(): Promise<NormalizedPerpTicker[]> {
        const baseUrl = this.getConfigUrl('bybitRestUrl', 'https://api.bybit.com');
        const response = await this.http.get<BybitApiResponse<{ list: BybitTickerItem[] }>>(
            this.exchange,
            `${baseUrl}/v5/market/tickers`,
            { category: 'linear' },
        );

        return normalizeBybitPerpTickers(response.result.list, response.time);
    }

    protected async fetchFundingRates(): Promise<NormalizedFundingRate[]> {
        const baseUrl = this.getConfigUrl('bybitRestUrl', 'https://api.bybit.com');
        const response = await this.http.get<BybitApiResponse<{ list: BybitTickerItem[] }>>(
            this.exchange,
            `${baseUrl}/v5/market/tickers`,
            { category: 'linear' },
        );

        return normalizeBybitFundingRates(response.result.list, response.time);
    }

    protected async fetchOpenInterest(): Promise<NormalizedOpenInterest[]> {
        const baseUrl = this.getConfigUrl('bybitRestUrl', 'https://api.bybit.com');
        const response = await this.http.get<BybitApiResponse<{ list: BybitTickerItem[] }>>(
            this.exchange,
            `${baseUrl}/v5/market/tickers`,
            { category: 'linear' },
        );

        return normalizeBybitOpenInterest(response.result.list, response.time);
    }

    protected async fetchInstruments(): Promise<NormalizedInstrument[]> {
        const baseUrl = this.getConfigUrl('bybitRestUrl', 'https://api.bybit.com');

        const [spotResponse, linearResponse] = await Promise.all([
            this.http.get<BybitApiResponse<{ list: BybitInstrumentItem[] }>>(
                this.exchange,
                `${baseUrl}/v5/market/instruments-info`,
                { category: 'spot' },
            ),
            this.http.get<BybitApiResponse<{ list: BybitInstrumentItem[] }>>(
                this.exchange,
                `${baseUrl}/v5/market/instruments-info`,
                { category: 'linear' },
            ),
        ]);

        return normalizeBybitInstruments(
            spotResponse.result.list,
            linearResponse.result.list,
        );
    }

    protected async ping(): Promise<void> {
        const baseUrl = this.getConfigUrl('bybitRestUrl', 'https://api.bybit.com');
        await this.http.get<BybitApiResponse<{ timeSecond: string }>>(
            this.exchange,
            `${baseUrl}/v5/market/time`,
        );
    }
}
