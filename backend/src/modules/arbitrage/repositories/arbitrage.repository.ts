import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { ArbitrageQueryDto } from '../dto/arbitrage-query.dto';
import {
    ArbitrageOpportunityDoc,
    ArbitrageOpportunityEntity,
} from '../entities/arbitrage-opportunity.entity';
import { ArbitrageTypeEnum } from '../enums/arbitrage-type.enum';
import { CalculatedOpportunity } from '../interfaces/arbitrage-calculation.interface';

/** Репозиторий арбитражных возможностей */
@Injectable()
export class ArbitrageRepository {
    constructor(
        @DatabaseModel(ArbitrageOpportunityEntity.name)
        private readonly model: Model<ArbitrageOpportunityDoc>,
    ) {}

    /** Bulk replace opportunities по типу */
    async replaceByType(
        type: ArbitrageTypeEnum,
        opportunities: CalculatedOpportunity[],
        calculatedAt: number,
    ): Promise<number> {
        await this.model.deleteMany({ type, calculatedAt: { $lt: calculatedAt } }).exec();

        if (opportunities.length === 0) {
            return 0;
        }

        const docs = opportunities.map((item) => ({
            ...item,
            metadata: item.metadata,
        }));

        const inserted = await this.model.insertMany(docs);
        return inserted.length;
    }

    /** Найти по фильтру, сортировка по opportunityScore */
    async findByQuery(query: ArbitrageQueryDto): Promise<ArbitrageOpportunityDoc[]> {
        const filter = this.buildFilter(query);
        return this.model
            .find(filter)
            .sort({ opportunityScore: -1, netYieldPercent: -1, calculatedAt: -1 })
            .limit(query.limit ?? 50)
            .exec();
    }

    /** Top opportunities */
    async findTop(limit: number, type?: ArbitrageTypeEnum): Promise<ArbitrageOpportunityDoc[]> {
        const filter: Record<string, unknown> = {};
        if (type) {
            filter.type = type;
        }
        return this.model
            .find(filter)
            .sort({ opportunityScore: -1, netYieldPercent: -1 })
            .limit(limit)
            .exec();
    }

    /** Найти по ID */
    async findById(id: string): Promise<ArbitrageOpportunityDoc | null> {
        return this.model.findById(id).exec();
    }

    /** Статистика */
    async getStats(): Promise<{
        fundingCount: number;
        cashCarryCount: number;
        avgOpportunityScore: number;
        maxNetYieldPercent: number;
        lastCalculatedAt: number | null;
    }> {
        const [fundingCount, cashCarryCount, aggregate] = await Promise.all([
            this.model.countDocuments({ type: ArbitrageTypeEnum.FUNDING }).exec(),
            this.model.countDocuments({ type: ArbitrageTypeEnum.CASH_CARRY }).exec(),
            this.model
                .aggregate<{ avgScore: number; maxNet: number; lastCalc: number | null }>([
                    {
                        $group: {
                            _id: null,
                            avgScore: { $avg: '$opportunityScore' },
                            maxNet: { $max: '$netYieldPercent' },
                            lastCalc: { $max: '$calculatedAt' },
                        },
                    },
                ])
                .exec(),
        ]);

        const stats = aggregate[0];
        return {
            fundingCount,
            cashCarryCount,
            avgOpportunityScore: stats?.avgScore ?? 0,
            maxNetYieldPercent: stats?.maxNet ?? 0,
            lastCalculatedAt: stats?.lastCalc ?? null,
        };
    }

    /** Удалить устаревшие записи */
    async deleteOlderThan(timestamp: number): Promise<number> {
        const result = await this.model.deleteMany({ calculatedAt: { $lt: timestamp } }).exec();
        return result.deletedCount;
    }

    private buildFilter(query: ArbitrageQueryDto): Record<string, unknown> {
        const filter: Record<string, unknown> = {};

        if (query.type) {
            filter.type = query.type;
        }
        if (query.exchange) {
            filter.spotExchange = query.exchange;
        }
        if (query.symbol) {
            filter.spotSymbol = query.symbol;
        }

        const minNet = query.minNetYield;
        if (minNet !== undefined) {
            filter.netYieldPercent = { $gte: minNet };
        }

        if (query.minFundingRate !== undefined) {
            filter.fundingRate = { $gte: query.minFundingRate };
        }

        if (query.minVolume24h !== undefined) {
            filter['metadata.volume24h'] = { $gte: query.minVolume24h };
        }

        if (query.maxSpread !== undefined) {
            filter['metadata.spotPerpSpreadPercent'] = { $lte: query.maxSpread };
        }

        if (query.allowedExchanges && query.allowedExchanges.length > 0) {
            filter.spotExchange = { $in: query.allowedExchanges };
        }

        if (query.symbolWhitelist && query.symbolWhitelist.length > 0) {
            filter.spotSymbol = { $in: query.symbolWhitelist };
        }

        if (query.symbolBlacklist && query.symbolBlacklist.length > 0) {
            const current = filter.spotSymbol as Record<string, unknown> | string | undefined;
            if (typeof current === 'object' && current !== null && '$in' in current) {
                filter.spotSymbol = {
                    $in: (current.$in as string[]).filter(
                        (s) => !query.symbolBlacklist!.includes(s),
                    ),
                };
            } else if (typeof current === 'string') {
                if (query.symbolBlacklist.includes(current)) {
                    filter.spotSymbol = { $in: [] };
                }
            } else {
                filter.spotSymbol = { $nin: query.symbolBlacklist };
            }
        }

        return filter;
    }
}
