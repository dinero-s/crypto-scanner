import { ExchangeEnum } from '../enums/exchange.enum';
import {
    NormalizedFundingRate,
    NormalizedInstrument,
    NormalizedOpenInterest,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from './normalized-market-data.interface';

/** Единый контракт public market data connector */
export interface ExchangeMarketDataConnector {
    /** Идентификатор биржи */
    getExchangeName(): ExchangeEnum;

    /** Все spot-тикеры */
    getSpotTickers(): Promise<NormalizedSpotTicker[]>;

    /** Все perpetual-тикеры */
    getPerpTickers(): Promise<NormalizedPerpTicker[]>;

    /** Текущие funding rates */
    getFundingRates(): Promise<NormalizedFundingRate[]>;

    /** Open interest по perpetual */
    getOpenInterest(): Promise<NormalizedOpenInterest[]>;

    /** Список торгуемых инструментов */
    getInstruments(): Promise<NormalizedInstrument[]>;

    /** Проверка доступности API */
    isHealthy(): Promise<boolean>;
}
