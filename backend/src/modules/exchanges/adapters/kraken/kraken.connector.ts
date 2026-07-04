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
    KrakenAssetPairsResponse,
    KrakenFuturesInstrumentsResponse,
    KrakenFuturesTickersResponse,
    KrakenSpotTickerResponse,
    normalizeKrakenFundingRates,
    normalizeKrakenInstruments,
    normalizeKrakenOpenInterest,
    normalizeKrakenPerpTickers,
    normalizeKrakenSpotTickers,
} from './kraken.normalizer';

/** Kraken spot + futures public market data connector */
@Injectable()
export class KrakenConnector extends BaseExchangeConnector {
    constructor(http: ExchangeHttpService, configService: ConfigService) {
        super(ExchangeEnum.KRAKEN, http, configService);
    }

    protected async fetchSpotTickers(): Promise<NormalizedSpotTicker[]> {
        const spotBase = this.getConfigUrl('krakenRestUrl', 'https://api.kraken.com');
        const response = await this.http.get<KrakenSpotTickerResponse>(
            this.exchange,
            `${spotBase}/0/public/Ticker`,
        );

        if (response.error.length > 0) {
            throw new Error(response.error.join(', '));
        }

        return normalizeKrakenSpotTickers(response.result);
    }

    protected async fetchPerpTickers(): Promise<NormalizedPerpTicker[]> {
        const futuresBase = this.getConfigUrl(
            'krakenFuturesUrl',
            'https://futures.kraken.com',
        );

        const response = await this.http.get<KrakenFuturesTickersResponse>(
            this.exchange,
            `${futuresBase}/derivatives/api/v3/tickers`,
        );

        return normalizeKrakenPerpTickers(response.tickers);
    }

    protected async fetchFundingRates(): Promise<NormalizedFundingRate[]> {
        const futuresBase = this.getConfigUrl(
            'krakenFuturesUrl',
            'https://futures.kraken.com',
        );

        const response = await this.http.get<KrakenFuturesTickersResponse>(
            this.exchange,
            `${futuresBase}/derivatives/api/v3/tickers`,
        );

        return normalizeKrakenFundingRates(response.tickers);
    }

    protected async fetchOpenInterest(): Promise<NormalizedOpenInterest[]> {
        const futuresBase = this.getConfigUrl(
            'krakenFuturesUrl',
            'https://futures.kraken.com',
        );

        const response = await this.http.get<KrakenFuturesTickersResponse>(
            this.exchange,
            `${futuresBase}/derivatives/api/v3/tickers`,
        );

        return normalizeKrakenOpenInterest(response.tickers);
    }

    protected async fetchInstruments(): Promise<NormalizedInstrument[]> {
        const spotBase = this.getConfigUrl('krakenRestUrl', 'https://api.kraken.com');
        const futuresBase = this.getConfigUrl(
            'krakenFuturesUrl',
            'https://futures.kraken.com',
        );

        const [spotResponse, futuresResponse] = await Promise.all([
            this.http.get<KrakenAssetPairsResponse>(
                this.exchange,
                `${spotBase}/0/public/AssetPairs`,
            ),
            this.http.get<KrakenFuturesInstrumentsResponse>(
                this.exchange,
                `${futuresBase}/derivatives/api/v3/instruments`,
            ),
        ]);

        if (spotResponse.error.length > 0) {
            throw new Error(spotResponse.error.join(', '));
        }

        return normalizeKrakenInstruments(
            spotResponse.result,
            futuresResponse.instruments,
        );
    }

    protected async ping(): Promise<void> {
        const spotBase = this.getConfigUrl('krakenRestUrl', 'https://api.kraken.com');
        const futuresBase = this.getConfigUrl(
            'krakenFuturesUrl',
            'https://futures.kraken.com',
        );

        await Promise.all([
            this.http.get<{ error: string[]; result: { unixtime: number } }>(
                this.exchange,
                `${spotBase}/0/public/Time`,
            ),
            this.http.get<KrakenFuturesTickersResponse>(
                this.exchange,
                `${futuresBase}/derivatives/api/v3/tickers`,
            ),
        ]);
    }
}
