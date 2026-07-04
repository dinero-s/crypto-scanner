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
    GateFundingRateItem,
    GateFuturesContractItem,
    GateFuturesTickerItem,
    GateSpotPairItem,
    GateSpotTickerItem,
    normalizeGateFundingRates,
    normalizeGateInstruments,
    normalizeGateOpenInterest,
    normalizeGatePerpTickers,
    normalizeGateSpotTickers,
} from './gate.normalizer';

/** Gate.io API v4 public market data connector */
@Injectable()
export class GateConnector extends BaseExchangeConnector {
    constructor(http: ExchangeHttpService, configService: ConfigService) {
        super(ExchangeEnum.GATE, http, configService);
    }

    protected async fetchSpotTickers(): Promise<NormalizedSpotTicker[]> {
        const baseUrl = this.getConfigUrl('gateRestUrl', 'https://api.gateio.ws');
        const response = await this.http.get<GateSpotTickerItem[]>(
            this.exchange,
            `${baseUrl}/api/v4/spot/tickers`,
        );

        return normalizeGateSpotTickers(response);
    }

    protected async fetchPerpTickers(): Promise<NormalizedPerpTicker[]> {
        const baseUrl = this.getConfigUrl('gateRestUrl', 'https://api.gateio.ws');
        const response = await this.http.get<GateFuturesTickerItem[]>(
            this.exchange,
            `${baseUrl}/api/v4/futures/usdt/tickers`,
        );

        return normalizeGatePerpTickers(response);
    }

    protected async fetchFundingRates(): Promise<NormalizedFundingRate[]> {
        const baseUrl = this.getConfigUrl('gateRestUrl', 'https://api.gateio.ws');
        const response = await this.http.get<GateFundingRateItem[]>(
            this.exchange,
            `${baseUrl}/api/v4/futures/usdt/funding_rate`,
        );

        return normalizeGateFundingRates(response);
    }

    protected async fetchOpenInterest(): Promise<NormalizedOpenInterest[]> {
        const baseUrl = this.getConfigUrl('gateRestUrl', 'https://api.gateio.ws');
        const response = await this.http.get<GateFuturesTickerItem[]>(
            this.exchange,
            `${baseUrl}/api/v4/futures/usdt/tickers`,
        );

        return normalizeGateOpenInterest(response);
    }

    protected async fetchInstruments(): Promise<NormalizedInstrument[]> {
        const baseUrl = this.getConfigUrl('gateRestUrl', 'https://api.gateio.ws');

        const [spotPairs, futuresContracts] = await Promise.all([
            this.http.get<GateSpotPairItem[]>(
                this.exchange,
                `${baseUrl}/api/v4/spot/currency_pairs`,
            ),
            this.http.get<GateFuturesContractItem[]>(
                this.exchange,
                `${baseUrl}/api/v4/futures/usdt/contracts`,
            ),
        ]);

        return normalizeGateInstruments(spotPairs, futuresContracts);
    }

    protected async ping(): Promise<void> {
        const baseUrl = this.getConfigUrl('gateRestUrl', 'https://api.gateio.ws');
        await this.http.get<{ server_time: number }>(
            this.exchange,
            `${baseUrl}/api/v4/spot/time`,
        );
    }
}
