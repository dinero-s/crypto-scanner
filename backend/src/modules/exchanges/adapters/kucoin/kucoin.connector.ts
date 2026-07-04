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
    KucoinApiResponse,
    KucoinFuturesContractItem,
    KucoinFuturesTickerItem,
    KucoinSpotSymbolItem,
    KucoinSpotTickerItem,
    normalizeKucoinFundingRates,
    normalizeKucoinInstruments,
    normalizeKucoinOpenInterest,
    normalizeKucoinPerpTickers,
    normalizeKucoinSpotTickers,
} from './kucoin.normalizer';

/** KuCoin spot + futures public market data connector */
@Injectable()
export class KucoinConnector extends BaseExchangeConnector {
    constructor(http: ExchangeHttpService, configService: ConfigService) {
        super(ExchangeEnum.KUCOIN, http, configService);
    }

    protected async fetchSpotTickers(): Promise<NormalizedSpotTicker[]> {
        const spotBase = this.getConfigUrl('kucoinRestUrl', 'https://api.kucoin.com');
        const response = await this.http.get<
            KucoinApiResponse<{ ticker: KucoinSpotTickerItem[] }>
        >(this.exchange, `${spotBase}/api/v1/market/allTickers`);

        return normalizeKucoinSpotTickers(response.data.ticker);
    }

    protected async fetchPerpTickers(): Promise<NormalizedPerpTicker[]> {
        const futuresBase = this.getConfigUrl(
            'kucoinFuturesUrl',
            'https://api-futures.kucoin.com',
        );

        const [contracts, tickersResponse] = await Promise.all([
            this.http.get<KucoinApiResponse<KucoinFuturesContractItem[]>>(
                this.exchange,
                `${futuresBase}/api/v1/contracts/active`,
            ),
            this.http.get<KucoinApiResponse<KucoinFuturesTickerItem[]>>(
                this.exchange,
                `${futuresBase}/api/v1/allTickers`,
            ),
        ]);

        return normalizeKucoinPerpTickers(contracts.data, tickersResponse.data);
    }

    protected async fetchFundingRates(): Promise<NormalizedFundingRate[]> {
        const futuresBase = this.getConfigUrl(
            'kucoinFuturesUrl',
            'https://api-futures.kucoin.com',
        );

        const contracts = await this.http.get<KucoinApiResponse<KucoinFuturesContractItem[]>>(
            this.exchange,
            `${futuresBase}/api/v1/contracts/active`,
        );

        return normalizeKucoinFundingRates(contracts.data);
    }

    protected async fetchOpenInterest(): Promise<NormalizedOpenInterest[]> {
        const futuresBase = this.getConfigUrl(
            'kucoinFuturesUrl',
            'https://api-futures.kucoin.com',
        );

        const contracts = await this.http.get<KucoinApiResponse<KucoinFuturesContractItem[]>>(
            this.exchange,
            `${futuresBase}/api/v1/contracts/active`,
        );

        return normalizeKucoinOpenInterest(contracts.data);
    }

    protected async fetchInstruments(): Promise<NormalizedInstrument[]> {
        const spotBase = this.getConfigUrl('kucoinRestUrl', 'https://api.kucoin.com');
        const futuresBase = this.getConfigUrl(
            'kucoinFuturesUrl',
            'https://api-futures.kucoin.com',
        );

        const [spotSymbols, futuresContracts] = await Promise.all([
            this.http.get<KucoinApiResponse<KucoinSpotSymbolItem[]>>(
                this.exchange,
                `${spotBase}/api/v2/symbols`,
            ),
            this.http.get<KucoinApiResponse<KucoinFuturesContractItem[]>>(
                this.exchange,
                `${futuresBase}/api/v1/contracts/active`,
            ),
        ]);

        return normalizeKucoinInstruments(spotSymbols.data, futuresContracts.data);
    }

    protected async ping(): Promise<void> {
        const spotBase = this.getConfigUrl('kucoinRestUrl', 'https://api.kucoin.com');
        const futuresBase = this.getConfigUrl(
            'kucoinFuturesUrl',
            'https://api-futures.kucoin.com',
        );

        await Promise.all([
            this.http.get<KucoinApiResponse<number>>(
                this.exchange,
                `${spotBase}/api/v1/timestamp`,
            ),
            this.http.get<KucoinApiResponse<number>>(
                this.exchange,
                `${futuresBase}/api/v1/timestamp`,
            ),
        ]);
    }
}
