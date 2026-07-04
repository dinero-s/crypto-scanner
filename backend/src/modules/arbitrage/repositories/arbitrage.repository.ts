import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { ArbitrageQueryDto } from '../dto/arbitrage-query.dto';
import {
    ArbitrageOpportunityDoc,
    ArbitrageOpportunityEntity,
} from '../entities/arbitrage-opportunity.entity';

/** Репозиторий арбитражных возможностей */
@Injectable()
export class ArbitrageRepository {
    constructor(
        @DatabaseModel(ArbitrageOpportunityEntity.name)
        private readonly model: Model<ArbitrageOpportunityDoc>,
    ) {}

    /** Сохранить возможность */
    async save(
        data: Partial<ArbitrageOpportunityEntity>,
    ): Promise<ArbitrageOpportunityDoc> {
        return this.model.create(data);
    }

    /** Найти по фильтру */
    async findByQuery(query: ArbitrageQueryDto): Promise<ArbitrageOpportunityDoc[]> {
        const filter: Record<string, unknown> = {};
        if (query.type) {
            filter.type = query.type;
        }
        if (query.exchange) {
            filter.exchange = query.exchange;
        }
        if (query.symbol) {
            filter.symbol = query.symbol;
        }
        if (query.minNetYieldPct !== undefined) {
            filter.netYieldPct = { $gte: query.minNetYieldPct };
        }
        return this.model
            .find(filter)
            .sort({ netYieldPct: -1, calculatedAt: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    /** Удалить устаревшие записи */
    async deleteOlderThan(timestamp: number): Promise<number> {
        const result = await this.model.deleteMany({ calculatedAt: { $lt: timestamp } }).exec();
        return result.deletedCount;
    }
}
