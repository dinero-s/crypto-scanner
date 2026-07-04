import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { ExchangeEnum, MarketTypeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { NormalizedInstrument } from 'src/modules/exchanges/interfaces/normalized-market-data.interface';
import {
    ExchangeInstrumentDoc,
    ExchangeInstrumentEntity,
} from '../entities/exchange-instrument.entity';

/** Репозиторий справочника инструментов */
@Injectable()
export class ExchangeInstrumentRepository {
    constructor(
        @DatabaseModel(ExchangeInstrumentEntity.name)
        private readonly model: Model<ExchangeInstrumentDoc>,
    ) {}

    /** Upsert инструментов биржи */
    async upsertMany(instruments: NormalizedInstrument[]): Promise<number> {
        if (instruments.length === 0) {
            return 0;
        }

        const ops = instruments.map((item) => ({
            updateOne: {
                filter: {
                    exchange: item.exchange,
                    marketType: item.marketType,
                    symbol: item.symbol,
                },
                update: {
                    $set: {
                        baseAsset: item.baseAsset,
                        quoteAsset: item.quoteAsset,
                        status: item.status,
                        contractType: item.contractType,
                        tickSize: item.tickSize,
                        stepSize: item.stepSize,
                        minQty: item.minQty,
                        maxQty: item.maxQty,
                    },
                },
                upsert: true,
            },
        }));

        const result = await this.model.bulkWrite(ops);
        return result.upsertedCount + result.modifiedCount;
    }

    /** Найти инструменты биржи */
    async findByExchange(
        exchange: ExchangeEnum,
        marketType?: MarketTypeEnum,
    ): Promise<ExchangeInstrumentDoc[]> {
        const filter: Record<string, unknown> = { exchange };
        if (marketType) {
            filter.marketType = marketType;
        }
        return this.model.find(filter).exec();
    }
}
