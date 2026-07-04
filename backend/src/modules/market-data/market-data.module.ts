import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { ExchangesModule } from '../exchanges/exchanges.module';
import {
    FundingRateSnapshotEntity,
    FundingRateSnapshotSchema,
} from './entities/funding-rate-snapshot.entity';
import {
    FuturesPriceSnapshotEntity,
    FuturesPriceSnapshotSchema,
} from './entities/futures-price-snapshot.entity';
import {
    SpotPriceSnapshotEntity,
    SpotPriceSnapshotSchema,
} from './entities/spot-price-snapshot.entity';
import { MarketDataRepository } from './repositories/market-data.repository';
import { FundingRateService } from './services/funding-rate.service';
import { FuturesPriceService } from './services/futures-price.service';
import { MarketDataCollectorService } from './services/market-data-collector.service';
import { OpenInterestService } from './services/open-interest.service';
import { SpotPriceService } from './services/spot-price.service';

/** Модуль сбора и хранения market data */
@Module({
    imports: [
        ExchangesModule,
        MongooseModule.forFeature(
            [
                { name: SpotPriceSnapshotEntity.name, schema: SpotPriceSnapshotSchema },
                { name: FuturesPriceSnapshotEntity.name, schema: FuturesPriceSnapshotSchema },
                { name: FundingRateSnapshotEntity.name, schema: FundingRateSnapshotSchema },
            ],
            DATABASE_CONNECTION_NAME,
        ),
    ],
    controllers: [],
    providers: [
        MarketDataRepository,
        MarketDataCollectorService,
        SpotPriceService,
        FuturesPriceService,
        FundingRateService,
        OpenInterestService,
    ],
    exports: [
        MarketDataRepository,
        MarketDataCollectorService,
        SpotPriceService,
        FuturesPriceService,
        FundingRateService,
        OpenInterestService,
    ],
})
export class MarketDataModule {}
