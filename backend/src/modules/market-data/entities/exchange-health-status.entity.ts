import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'exchange_health_statuses';

/** Статус доступности биржи */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class ExchangeHealthStatusEntity {
    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true })
    exchange: ExchangeEnum;

    @DatabaseProp({ type: Boolean, required: true })
    healthy: boolean;

    @DatabaseProp({ type: Date, required: true })
    lastCheckedAt: Date;

    @DatabaseProp({ type: Date, default: null })
    lastSuccessAt?: Date;

    @DatabaseProp({ type: String, default: null })
    lastError?: string;

    @DatabaseProp({ type: Number, default: null })
    latencyMs?: number;
}

export const ExchangeHealthStatusSchema = DatabaseSchema(ExchangeHealthStatusEntity);

ExchangeHealthStatusSchema.index({ exchange: 1 }, { unique: true });

export type ExchangeHealthStatusDoc = IDatabaseDocument<ExchangeHealthStatusEntity>;
