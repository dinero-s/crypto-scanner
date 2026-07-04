import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BinanceConnector } from './adapters/binance/binance.connector';
import { BybitConnector } from './adapters/bybit/bybit.connector';
import { GateConnector } from './adapters/gate/gate.connector';
import { KrakenConnector } from './adapters/kraken/kraken.connector';
import { KucoinConnector } from './adapters/kucoin/kucoin.connector';
import { OkxConnector } from './adapters/okx/okx.connector';
import { ExchangeConnectorService } from './services/exchange-connector.service';
import { ExchangeHttpService } from './services/exchange-http.service';
import { ExchangeRateLimiterService } from './services/exchange-rate-limiter.service';
import { ExchangeRegistryService } from './services/exchange-registry.service';
import { SymbolNormalizerService } from './services/symbol-normalizer.service';

/** Модуль бирж: public market data connectors, нормализация символов */
@Module({
    imports: [
        ConfigModule,
        HttpModule.register({
            timeout: 10_000,
            maxRedirects: 3,
        }),
    ],
    controllers: [],
    providers: [
        ExchangeRateLimiterService,
        ExchangeHttpService,
        BinanceConnector,
        BybitConnector,
        OkxConnector,
        GateConnector,
        KucoinConnector,
        KrakenConnector,
        ExchangeRegistryService,
        ExchangeConnectorService,
        SymbolNormalizerService,
    ],
    exports: [
        ExchangeRegistryService,
        ExchangeConnectorService,
        SymbolNormalizerService,
    ],
})
export class ExchangesModule {}
