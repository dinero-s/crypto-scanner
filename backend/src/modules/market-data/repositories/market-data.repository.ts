import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import {
    NormalizedFundingRate,
    NormalizedPerpTicker,
    NormalizedSpotTicker,
} from 'src/modules/exchanges/interfaces/normalized-market-data.interface';
import { MarketDataQueryDto } from '../dto/market-data-query.dto';
import {
    FundingRateDoc,
    FundingRateEntity,
} from '../entities/funding-rate.entity';
import {
    MarketDataSnapshotDoc,
    MarketDataSnapshotEntity,
} from '../entities/market-data-snapshot.entity';
import { PerpTickerDoc, PerpTickerEntity } from '../entities/perp-ticker.entity';
import { SpotTickerDoc, SpotTickerEntity } from '../entities/spot-ticker.entity';

/** Репозиторий снимков market data */
@Injectable()
export class MarketDataRepository {
    constructor(
        @DatabaseModel(SpotTickerEntity.name)
        private readonly spotModel: Model<SpotTickerDoc>,
        @DatabaseModel(PerpTickerEntity.name)
        private readonly perpModel: Model<PerpTickerDoc>,
        @DatabaseModel(FundingRateEntity.name)
        private readonly fundingModel: Model<FundingRateDoc>,
        @DatabaseModel(MarketDataSnapshotEntity.name)
        private readonly snapshotModel: Model<MarketDataSnapshotDoc>,
    ) {}

    /** Bulk insert spot-тикеров */
    async insertSpotTickers(tickers: NormalizedSpotTicker[]): Promise<number> {
        if (tickers.length === 0) {
            return 0;
        }
        const docs = tickers.map((t) => ({
            exchange: t.exchange,
            symbol: t.symbol,
            baseAsset: t.baseAsset,
            quoteAsset: t.quoteAsset,
            bid: t.bid,
            ask: t.ask,
            last: t.last,
            volume24h: t.volume24h,
            timestamp: t.timestamp,
        }));
        const result = await this.spotModel.insertMany(docs, { ordered: false });
        return result.length;
    }

    /** Bulk insert perp-тикеров */
    async insertPerpTickers(tickers: NormalizedPerpTicker[]): Promise<number> {
        if (tickers.length === 0) {
            return 0;
        }
        const docs = tickers.map((t) => ({
            exchange: t.exchange,
            symbol: t.symbol,
            baseAsset: t.baseAsset,
            quoteAsset: t.quoteAsset,
            bid: t.bid,
            ask: t.ask,
            last: t.last,
            markPrice: t.markPrice,
            indexPrice: t.indexPrice,
            volume24h: t.volume24h,
            openInterest: t.openInterest,
            timestamp: t.timestamp,
        }));
        const result = await this.perpModel.insertMany(docs, { ordered: false });
        return result.length;
    }

    /** Bulk insert funding rates */
    async insertFundingRates(rates: NormalizedFundingRate[]): Promise<number> {
        if (rates.length === 0) {
            return 0;
        }
        const docs = rates.map((r) => ({
            exchange: r.exchange,
            symbol: r.symbol,
            baseAsset: r.baseAsset,
            quoteAsset: r.quoteAsset,
            fundingRate: r.fundingRate,
            predictedFundingRate: r.predictedFundingRate,
            nextFundingTime: r.nextFundingTime,
            fundingIntervalHours: r.fundingIntervalHours,
            timestamp: r.timestamp,
        }));
        const result = await this.fundingModel.insertMany(docs, { ordered: false });
        return result.length;
    }

    /** Сохранить агрегированный снимок */
    async saveSnapshot(
        exchange: ExchangeEnum,
        snapshotType: string,
        payload: Record<string, unknown>,
        recordCount: number,
        timestamp: number,
    ): Promise<MarketDataSnapshotDoc> {
        return this.snapshotModel.create({
            exchange,
            snapshotType,
            payload,
            recordCount,
            timestamp,
        });
    }

    /** Последние spot-тикеры */
    async findLatestSpot(query: MarketDataQueryDto): Promise<SpotTickerDoc[]> {
        const filter = this.buildFilter(query);
        return this.spotModel
            .find(filter)
            .sort({ timestamp: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    /** Последние perp-тикеры */
    async findLatestPerp(query: MarketDataQueryDto): Promise<PerpTickerDoc[]> {
        const filter = this.buildFilter(query);
        return this.perpModel
            .find(filter)
            .sort({ timestamp: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    /** Последние funding rates */
    async findLatestFunding(query: MarketDataQueryDto): Promise<FundingRateDoc[]> {
        const filter = this.buildFilter(query);
        return this.fundingModel
            .find(filter)
            .sort({ timestamp: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    /** Удалить записи старше cutoff */
    async deleteOlderThan(cutoff: Date): Promise<{
        spot: number;
        perp: number;
        funding: number;
        snapshots: number;
    }> {
        const [spot, perp, funding, snapshots] = await Promise.all([
            this.spotModel.deleteMany({ createdAt: { $lt: cutoff } }).exec(),
            this.perpModel.deleteMany({ createdAt: { $lt: cutoff } }).exec(),
            this.fundingModel.deleteMany({ createdAt: { $lt: cutoff } }).exec(),
            this.snapshotModel.deleteMany({ createdAt: { $lt: cutoff } }).exec(),
        ]);

        return {
            spot: spot.deletedCount,
            perp: perp.deletedCount,
            funding: funding.deletedCount,
            snapshots: snapshots.deletedCount,
        };
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
