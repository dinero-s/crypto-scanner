import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';

/** Сбор futures/perpetual цен */
@Injectable()
export class FuturesPriceService {
    private readonly logger = new Logger(FuturesPriceService.name);

    constructor(private readonly exchangeRegistry: ExchangeRegistryService) {}

    /** Собрать futures-цену */
    async collectFutures(exchange: ExchangeEnum, unifiedSymbol: string): Promise<void> {
        const connector = this.exchangeRegistry.getConnector(exchange);
        const tickers = await connector.getPerpTickers();
        const ticker = tickers.find((item) => item.symbol === unifiedSymbol);

        this.logger.debug(
            `collectFutures: ${exchange}/${unifiedSymbol} found=${String(Boolean(ticker))}`,
        );
    }
}
