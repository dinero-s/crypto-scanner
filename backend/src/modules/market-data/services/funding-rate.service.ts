import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { ExchangeRegistryService } from 'src/modules/exchanges/services/exchange-registry.service';

/** Сбор funding rate и predicted funding */
@Injectable()
export class FundingRateService {
    private readonly logger = new Logger(FundingRateService.name);

    constructor(private readonly exchangeRegistry: ExchangeRegistryService) {}

    /** Собрать funding rate */
    async collectFundingRate(exchange: ExchangeEnum, unifiedSymbol: string): Promise<void> {
        const connector = this.exchangeRegistry.getConnector(exchange);
        const rates = await connector.getFundingRates();
        const rate = rates.find((item) => item.symbol === unifiedSymbol);

        this.logger.debug(
            `collectFundingRate: ${exchange}/${unifiedSymbol} found=${String(Boolean(rate))}`,
        );
    }
}
