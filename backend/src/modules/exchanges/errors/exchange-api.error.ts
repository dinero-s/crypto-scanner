import { ExchangeEnum } from '../enums/exchange.enum';

/** Ошибка публичного API биржи */
export class ExchangeApiError extends Error {
    readonly exchange: ExchangeEnum;

    readonly endpoint: string;

    readonly statusCode?: number;

    readonly cause?: unknown;

    constructor(
        exchange: ExchangeEnum,
        endpoint: string,
        message: string,
        statusCode?: number,
        cause?: unknown,
    ) {
        super(message);
        this.name = 'ExchangeApiError';
        this.exchange = exchange;
        this.endpoint = endpoint;
        this.statusCode = statusCode;
        this.cause = cause;
    }
}
