import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';

/** Сбор spot-цен */
@Injectable()
export class SpotPriceService {
    private readonly logger = new Logger(SpotPriceService.name);

    constructor(private readonly exchangeRegistry: ExchangeRegistryService) {}

    /** Собрать spot-цену для символа на бирже */
    async collectSpot(exchange: ExchangeEnum, unifiedSymbol: string): Promise<void> {
        const connector = this.exchangeRegistry.getConnector(exchange);
        const tickers = await connector.getSpotTickers();
        const ticker = tickers.find((item) => item.symbol === unifiedSymbol);

        this.logger.debug(
            `collectSpot: ${exchange}/${unifiedSymbol} found=${String(Boolean(ticker))}`,
        );
    }
}
