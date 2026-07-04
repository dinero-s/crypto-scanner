import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import {
    FundingRateSnapshotDoc,
    FundingRateSnapshotEntity,
} from '../entities/funding-rate-snapshot.entity';
import {
    FuturesPriceSnapshotDoc,
    FuturesPriceSnapshotEntity,
} from '../entities/futures-price-snapshot.entity';
import {
    SpotPriceSnapshotDoc,
    SpotPriceSnapshotEntity,
} from '../entities/spot-price-snapshot.entity';
import { MarketDataQueryDto } from '../dto/market-data-query.dto';

/** Репозиторий снимков market data */
@Injectable()
export class MarketDataRepository {
    constructor(
        @DatabaseModel(SpotPriceSnapshotEntity.name)
        private readonly spotModel: Model<SpotPriceSnapshotDoc>,
        @DatabaseModel(FuturesPriceSnapshotEntity.name)
        private readonly futuresModel: Model<FuturesPriceSnapshotDoc>,
        @DatabaseModel(FundingRateSnapshotEntity.name)
        private readonly fundingModel: Model<FundingRateSnapshotDoc>,
    ) {}

    /** Сохранить spot-снимок */
    async saveSpotSnapshot(
        data: Partial<SpotPriceSnapshotEntity>,
    ): Promise<SpotPriceSnapshotDoc> {
        return this.spotModel.create(data);
    }

    /** Сохранить futures-снимок */
    async saveFuturesSnapshot(
        data: Partial<FuturesPriceSnapshotEntity>,
    ): Promise<FuturesPriceSnapshotDoc> {
        return this.futuresModel.create(data);
    }

    /** Сохранить funding-снимок */
    async saveFundingSnapshot(
        data: Partial<FundingRateSnapshotEntity>,
    ): Promise<FundingRateSnapshotDoc> {
        return this.fundingModel.create(data);
    }

    /** Последние spot-снимки */
    async findLatestSpot(query: MarketDataQueryDto): Promise<SpotPriceSnapshotDoc[]> {
        const filter = this.buildFilter(query);
        return this.spotModel
            .find(filter)
            .sort({ quoteTimestamp: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    /** Последние futures-снимки */
    async findLatestFutures(
        query: MarketDataQueryDto,
    ): Promise<FuturesPriceSnapshotDoc[]> {
        const filter = this.buildFilter(query);
        return this.futuresModel
            .find(filter)
            .sort({ quoteTimestamp: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    /** Последние funding-снимки */
    async findLatestFunding(
        query: MarketDataQueryDto,
    ): Promise<FundingRateSnapshotDoc[]> {
        const filter = this.buildFilter(query);
        return this.fundingModel
            .find(filter)
            .sort({ quoteTimestamp: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    private buildFilter(query: MarketDataQueryDto): Record<string, unknown> {
        const filter: Record<string, unknown> = {};
        if (query.exchange) {
            filter.exchange = query.exchange as ExchangeEnum;
        }
        if (query.symbol) {
            filter.symbol = query.symbol;
        }
        return filter;
    }
}
