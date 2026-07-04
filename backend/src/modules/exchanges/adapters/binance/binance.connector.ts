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
import { BaseExchangeConnector } from '../base-exchange.connector';
import {
    BinanceBookTicker,
    BinanceFuturesSymbolInfo,
    BinanceFuturesTicker24hr,
    BinanceOpenInterestFetchResult,
    BinanceOpenInterestResponse,
    BinancePremiumIndex,
    BinanceSpotSymbolInfo,
    BinanceSpotTicker24hr,
    normalizeBinanceFundingRates,
    normalizeBinanceOpenInterest,
    normalizeBinancePerpInstruments,
    normalizeBinancePerpTickers,
    normalizeBinanceSpotInstruments,
    normalizeBinanceSpotTickers,
} from './binance.normalizer';
import { ExchangeHttpService } from '../../services/exchange-http.service';

interface BinanceExchangeInfoResponse<T> {
    symbols: T[];
}

/** Binance public market data connector */
@Injectable()
export class BinanceConnector extends BaseExchangeConnector {
    constructor(http: ExchangeHttpService, configService: ConfigService) {
        super(ExchangeEnum.BINANCE, http, configService);
    }

    protected async fetchSpotTickers(): Promise<NormalizedSpotTicker[]> {
        const spotBase = this.getConfigUrl('binanceRestUrl', 'https://api.binance.com');

        const [tickers24hr, bookTickers] = await Promise.all([
            this.http.get<BinanceSpotTicker24hr[]>(
                this.exchange,
                `${spotBase}/api/v3/ticker/24hr`,
            ),
            this.http.get<BinanceBookTicker[]>(
                this.exchange,
                `${spotBase}/api/v3/ticker/bookTicker`,
            ),
        ]);

        return normalizeBinanceSpotTickers(tickers24hr, bookTickers);
    }

    protected async fetchPerpTickers(): Promise<NormalizedPerpTicker[]> {
        const futuresBase = this.getConfigUrl(
            'binanceFuturesUrl',
            'https://fapi.binance.com',
        );

        const [tickers24hr, premiumIndex] = await Promise.all([
            this.http.get<BinanceFuturesTicker24hr[]>(
                this.exchange,
                `${futuresBase}/fapi/v1/ticker/24hr`,
            ),
            this.http.get<BinancePremiumIndex[]>(
                this.exchange,
                `${futuresBase}/fapi/v1/premiumIndex`,
            ),
        ]);

        return normalizeBinancePerpTickers(tickers24hr, premiumIndex);
    }

    protected async fetchFundingRates(): Promise<NormalizedFundingRate[]> {
        const futuresBase = this.getConfigUrl(
            'binanceFuturesUrl',
            'https://fapi.binance.com',
        );

        const premiumIndex = await this.http.get<BinancePremiumIndex[]>(
            this.exchange,
            `${futuresBase}/fapi/v1/premiumIndex`,
        );

        return normalizeBinanceFundingRates(premiumIndex);
    }

    protected async fetchOpenInterest(): Promise<NormalizedOpenInterest[]> {
        const futuresBase = this.getConfigUrl(
            'binanceFuturesUrl',
            'https://fapi.binance.com',
        );

        const exchangeInfo = await this.http.get<
            BinanceExchangeInfoResponse<BinanceFuturesSymbolInfo>
        >(this.exchange, `${futuresBase}/fapi/v1/exchangeInfo`);

        const symbols = exchangeInfo.symbols
            .filter(
                (item) =>
                    item.contractType === 'PERPETUAL' &&
                    item.quoteAsset === 'USDT' &&
                    item.status === 'TRADING',
            )
            .map((item) => item.symbol);

        const openInterestItems = await this.fetchBinanceOpenInterestBatch(
            futuresBase,
            symbols,
        );

        return normalizeBinanceOpenInterest(openInterestItems);
    }

    /** Параллельный сбор OI по всем perpetual symbols с per-symbol fallback */
    private async fetchBinanceOpenInterestBatch(
        futuresBase: string,
        symbols: string[],
        batchSize = 10,
    ): Promise<BinanceOpenInterestFetchResult[]> {
        const results: BinanceOpenInterestFetchResult[] = [];

        for (let offset = 0; offset < symbols.length; offset += batchSize) {
            const batch = symbols.slice(offset, offset + batchSize);
            const batchResults = await Promise.all(
                batch.map(async (symbol) => {
                    try {
                        const item = await this.http.get<BinanceOpenInterestResponse>(
                            this.exchange,
                            `${futuresBase}/fapi/v1/openInterest`,
                            { symbol },
                        );

                        return {
                            symbol: item.symbol,
                            openInterest: item.openInterest,
                            time: item.time,
                            available: true,
                        };
                    } catch {
                        return {
                            symbol,
                            openInterest: null,
                            time: Date.now(),
                            available: false,
                        };
                    }
                }),
            );

            results.push(...batchResults);
        }

        return results;
    }

    protected async fetchInstruments(): Promise<NormalizedInstrument[]> {
        const spotBase = this.getConfigUrl('binanceRestUrl', 'https://api.binance.com');
        const futuresBase = this.getConfigUrl(
            'binanceFuturesUrl',
            'https://fapi.binance.com',
        );

        const [spotInfo, futuresInfo] = await Promise.all([
            this.http.get<BinanceExchangeInfoResponse<BinanceSpotSymbolInfo>>(
                this.exchange,
                `${spotBase}/api/v3/exchangeInfo`,
            ),
            this.http.get<BinanceExchangeInfoResponse<BinanceFuturesSymbolInfo>>(
                this.exchange,
                `${futuresBase}/fapi/v1/exchangeInfo`,
            ),
        ]);

        return [
            ...normalizeBinanceSpotInstruments(spotInfo.symbols),
            ...normalizeBinancePerpInstruments(futuresInfo.symbols),
        ];
    }

    protected async ping(): Promise<void> {
        const spotBase = this.getConfigUrl('binanceRestUrl', 'https://api.binance.com');
        const futuresBase = this.getConfigUrl(
            'binanceFuturesUrl',
            'https://fapi.binance.com',
        );

        await Promise.all([
            this.http.get<Record<string, never>>(this.exchange, `${spotBase}/api/v3/ping`),
            this.http.get<Record<string, never>>(
                this.exchange,
                `${futuresBase}/fapi/v1/ping`,
            ),
        ]);
    }
}
