/** Публичные возможности биржи */
export interface ExchangeCapabilitiesInterface {
    /** Поддержка spot */
    spot: boolean;

    /** Поддержка perpetual/futures */
    perpetual: boolean;

    /** Доступен funding rate */
    fundingRate: boolean;

    /** Доступен прогноз следующего funding */
    predictedFunding: boolean;

    /** Доступен open interest */
    openInterest: boolean;
}
