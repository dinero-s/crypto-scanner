/** Поддерживаемые биржи (публичные API) */
export enum ExchangeEnum {
    BINANCE = 'binance',
    BYBIT = 'bybit',
    OKX = 'okx',
    GATE = 'gate',
    KUCOIN = 'kucoin',
    KRAKEN = 'kraken',
}

/** Тип рынка */
export enum MarketTypeEnum {
    SPOT = 'spot',
    FUTURES = 'futures',
    PERPETUAL = 'perpetual',
}
