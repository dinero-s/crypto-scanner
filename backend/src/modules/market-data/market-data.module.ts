import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { ExchangesModule } from '../exchanges/exchanges.module';
import {
    ExchangeHealthStatusEntity,
    ExchangeHealthStatusSchema,
} from './entities/exchange-health-status.entity';
import {
    ExchangeInstrumentEntity,
    ExchangeInstrumentSchema,
} from './entities/exchange-instrument.entity';
import {
    FundingRateEntity,
    FundingRateSchema,
} from './entities/funding-rate.entity';
import {
    MarketDataSnapshotEntity,
    MarketDataSnapshotSchema,
} from './entities/market-data-snapshot.entity';
import { PerpTickerEntity, PerpTickerSchema } from './entities/perp-ticker.entity';
import { SpotTickerEntity, SpotTickerSchema } from './entities/spot-ticker.entity';
import { ExchangeHealthRepository } from './repositories/exchange-health.repository';
import { ExchangeInstrumentRepository } from './repositories/exchange-instrument.repository';
import { MarketDataRepository } from './repositories/market-data.repository';
import { ExchangeHealthService } from './services/exchange-health.service';
import { FundingRateService } from './services/funding-rate.service';
import { FuturesPriceService } from './services/futures-price.service';
import { InstrumentCollectorService } from './services/instrument-collector.service';
import { MarketDataCacheService } from './services/market-data-cache.service';
import { MarketDataCollectorService } from './services/market-data-collector.service';
import { MarketDataQueryService } from './services/market-data-query.service';
import { OpenInterestService } from './services/open-interest.service';
import { SpotPriceService } from './services/spot-price.service';

/** Модуль сбора и хранения market data */
@Module({
    imports: [
        ConfigModule,
        ExchangesModule,
        MongooseModule.forFeature(
            [
                { name: ExchangeInstrumentEntity.name, schema: ExchangeInstrumentSchema },
                { name: SpotTickerEntity.name, schema: SpotTickerSchema },
                { name: PerpTickerEntity.name, schema: PerpTickerSchema },
                { name: FundingRateEntity.name, schema: FundingRateSchema },
                { name: MarketDataSnapshotEntity.name, schema: MarketDataSnapshotSchema },
                { name: ExchangeHealthStatusEntity.name, schema: ExchangeHealthStatusSchema },
            ],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    controllers: [],
    providers: [
        MarketDataRepository,
        ExchangeInstrumentRepository,
        ExchangeHealthRepository,
        MarketDataCacheService,
        ExchangeHealthService,
        MarketDataCollectorService,
        InstrumentCollectorService,
        SpotPriceService,
        FuturesPriceService,
        FundingRateService,
        OpenInterestService,
        MarketDataQueryService,
    ],
    exports: [
        MarketDataRepository,
        ExchangeHealthRepository,
        MarketDataCacheService,
        ExchangeHealthService,
        MarketDataCollectorService,
        MarketDataQueryService,
        SpotPriceService,
        FuturesPriceService,
        FundingRateService,
        OpenInterestService,
    ],
})
export class MarketDataModule {}
