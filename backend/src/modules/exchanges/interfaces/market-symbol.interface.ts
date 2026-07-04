import { ExchangeEnum } from '../enums/exchange.enum';
import { MarketTypeEnum } from '../enums/exchange.enum';

/** Унифицированный символ (BASE/QUOTE) */
export interface UnifiedSymbolInterface {
    base: string;
    quote: string;
    unified: string;
}

/** Символ на конкретной бирже */
export interface ExchangeSymbolInterface {
    exchange: ExchangeEnum;
    marketType: MarketTypeEnum;
    nativeSymbol: string;
    unified: UnifiedSymbolInterface;
}
