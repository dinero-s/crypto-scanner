import { Module } from '@nestjs/common';
import { ArbitrageModule } from '../arbitrage/arbitrage.module';
import { ExchangesModule } from '../exchanges/exchanges.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { MiniAppApiService } from './services/mini-app-api.service';

/** REST API слой для Telegram Mini App */
@Module({
    imports: [ExchangesModule, MarketDataModule, ArbitrageModule],
    controllers: [],
    providers: [MiniAppApiService],
    exports: [MiniAppApiService],
})
export class MiniAppApiModule {}
