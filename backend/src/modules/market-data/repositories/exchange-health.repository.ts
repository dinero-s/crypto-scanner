import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import {
    ExchangeHealthStatusDoc,
    ExchangeHealthStatusEntity,
} from '../entities/exchange-health-status.entity';

export interface ExchangeHealthRecord {
    exchange: ExchangeEnum;
    healthy: boolean;
    lastCheckedAt: Date;
    lastSuccessAt?: Date;
    lastError?: string;
    latencyMs?: number;
}

/** Репозиторий статусов здоровья бирж */
@Injectable()
export class ExchangeHealthRepository {
    constructor(
        @DatabaseModel(ExchangeHealthStatusEntity.name)
        private readonly model: Model<ExchangeHealthStatusDoc>,
    ) {}

    /** Upsert статуса биржи */
    async upsertStatus(record: ExchangeHealthRecord): Promise<ExchangeHealthStatusDoc> {
        const update: Record<string, unknown> = {
            healthy: record.healthy,
            lastCheckedAt: record.lastCheckedAt,
            lastError: record.lastError ?? null,
            latencyMs: record.latencyMs ?? null,
        };

        if (record.lastSuccessAt) {
            update.lastSuccessAt = record.lastSuccessAt;
        }

        return this.model
            .findOneAndUpdate({ exchange: record.exchange }, { $set: update }, { upsert: true, new: true })
            .exec();
    }

    /** Все статусы бирж */
    async findAll(): Promise<ExchangeHealthStatusDoc[]> {
        return this.model.find().sort({ exchange: 1 }).exec();
    }

    /** Статус одной биржи */
    async findByExchange(exchange: ExchangeEnum): Promise<ExchangeHealthStatusDoc | null> {
        return this.model.findOne({ exchange }).exec();
    }
}
