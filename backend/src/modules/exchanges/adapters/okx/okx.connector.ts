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
    OkxApiResponse,
    OkxFundingRateItem,
    OkxInstrumentItem,
    OkxOpenInterestItem,
    OkxTickerItem,
    normalizeOkxFundingRates,
    normalizeOkxInstruments,
    normalizeOkxOpenInterest,
    normalizeOkxPerpTickers,
    normalizeOkxSpotTickers,
} from './okx.normalizer';

/** OKX V5 public market data connector */
@Injectable()
export class OkxConnector extends BaseExchangeConnector {
    constructor(http: ExchangeHttpService, configService: ConfigService) {
        super(ExchangeEnum.OKX, http, configService);
    }

    protected async fetchSpotTickers(): Promise<NormalizedSpotTicker[]> {
        const baseUrl = this.getConfigUrl('okxRestUrl', 'https://www.okx.com');
        const response = await this.http.get<OkxApiResponse<OkxTickerItem[]>>(
            this.exchange,
            `${baseUrl}/api/v5/market/tickers`,
            { instType: 'SPOT' },
        );

        return normalizeOkxSpotTickers(response.data);
    }

    protected async fetchPerpTickers(): Promise<NormalizedPerpTicker[]> {
        const baseUrl = this.getConfigUrl('okxRestUrl', 'https://www.okx.com');
        const response = await this.http.get<OkxApiResponse<OkxTickerItem[]>>(
            this.exchange,
            `${baseUrl}/api/v5/market/tickers`,
            { instType: 'SWAP' },
        );

        const tickers = normalizeOkxPerpTickers(response.data);
        const openInterest = await this.fetchOpenInterest();
        const oiMap = new Map(openInterest.map((item) => [item.symbol, item.openInterest]));

        return tickers.map((item) => ({
            ...item,
            openInterest: oiMap.get(item.symbol) ?? item.openInterest,
        }));
    }

    protected async fetchFundingRates(): Promise<NormalizedFundingRate[]> {
        const baseUrl = this.getConfigUrl('okxRestUrl', 'https://www.okx.com');
        const response = await this.http.get<OkxApiResponse<OkxFundingRateItem[]>>(
            this.exchange,
            `${baseUrl}/api/v5/public/funding-rate`,
            { instId: 'ANY' },
        );

        return normalizeOkxFundingRates(response.data);
    }

    protected async fetchOpenInterest(): Promise<NormalizedOpenInterest[]> {
        const baseUrl = this.getConfigUrl('okxRestUrl', 'https://www.okx.com');
        const response = await this.http.get<OkxApiResponse<OkxOpenInterestItem[]>>(
            this.exchange,
            `${baseUrl}/api/v5/public/open-interest`,
            { instType: 'SWAP' },
        );

        return normalizeOkxOpenInterest(response.data);
    }

    protected async fetchInstruments(): Promise<NormalizedInstrument[]> {
        const baseUrl = this.getConfigUrl('okxRestUrl', 'https://www.okx.com');

        const [spotResponse, swapResponse] = await Promise.all([
            this.http.get<OkxApiResponse<OkxInstrumentItem[]>>(
                this.exchange,
                `${baseUrl}/api/v5/public/instruments`,
                { instType: 'SPOT' },
            ),
            this.http.get<OkxApiResponse<OkxInstrumentItem[]>>(
                this.exchange,
                `${baseUrl}/api/v5/public/instruments`,
                { instType: 'SWAP' },
            ),
        ]);

        return normalizeOkxInstruments([...spotResponse.data, ...swapResponse.data]);
    }

    protected async ping(): Promise<void> {
        const baseUrl = this.getConfigUrl('okxRestUrl', 'https://www.okx.com');
        await this.http.get<OkxApiResponse<{ ts: string }[]>>(
            this.exchange,
            `${baseUrl}/api/v5/public/time`,
        );
    }
}
