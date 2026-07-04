import { Injectable, Logger } from '@nestjs/common';
import { ExchangeEnum } from '../enums/exchange.enum';
import { BinanceConnector } from '../adapters/binance/binance.connector';
import { BybitConnector } from '../adapters/bybit/bybit.connector';
import { GateConnector } from '../adapters/gate/gate.connector';
import { KrakenConnector } from '../adapters/kraken/kraken.connector';
import { KucoinConnector } from '../adapters/kucoin/kucoin.connector';
import { OkxConnector } from '../adapters/okx/okx.connector';
import { ExchangeMarketDataConnector } from '../interfaces/exchange-market-data-connector.interface';

/** Реестр public market data connectors */
@Injectable()
export class ExchangeRegistryService {
    private readonly logger = new Logger(ExchangeRegistryService.name);

    private readonly connectors = new Map<ExchangeEnum, ExchangeMarketDataConnector>();

    constructor(
        private readonly binanceConnector: BinanceConnector,
        private readonly bybitConnector: BybitConnector,
        private readonly okxConnector: OkxConnector,
        private readonly gateConnector: GateConnector,
        private readonly kucoinConnector: KucoinConnector,
        private readonly krakenConnector: KrakenConnector,
    ) {
        this.register(this.binanceConnector);
        this.register(this.bybitConnector);
        this.register(this.okxConnector);
        this.register(this.gateConnector);
        this.register(this.kucoinConnector);
        this.register(this.krakenConnector);
    }

    /** Получить connector по бирже */
    getConnector(exchange: ExchangeEnum): ExchangeMarketDataConnector {
        const connector = this.connectors.get(exchange);

        if (!connector) {
            this.logger.warn(`Connector не найден: ${exchange}`);
            throw new Error(`Exchange connector not found: ${exchange}`);
        }

        return connector;
    }

    /** Все подключённые connectors */
    getAllConnectors(): ExchangeMarketDataConnector[] {
        return Array.from(this.connectors.values());
    }

    /** Список поддерживаемых бирж */
    getSupportedExchanges(): ExchangeEnum[] {
        return Array.from(this.connectors.keys());
    }

    private register(connector: ExchangeMarketDataConnector): void {
        this.connectors.set(connector.getExchangeName(), connector);
    }
}
