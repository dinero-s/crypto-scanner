import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';

/** Сбор open interest (если биржа поддерживает) */
@Injectable()
export class OpenInterestService {
    private readonly logger = new Logger(OpenInterestService.name);

    constructor(private readonly exchangeRegistry: ExchangeRegistryService) {}

    /** Собрать open interest */
    async collectOpenInterest(exchange: ExchangeEnum, unifiedSymbol: string): Promise<void> {
        const connector = this.exchangeRegistry.getConnector(exchange);
        const items = await connector.getOpenInterest();
        const item = items.find((entry) => entry.symbol === unifiedSymbol);

        this.logger.debug(
            `collectOpenInterest: ${exchange}/${unifiedSymbol} found=${String(Boolean(item))}`,
        );
    }
}
