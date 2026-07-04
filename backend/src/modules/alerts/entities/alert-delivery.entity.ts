import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ArbitrageTypeEnum } from 'src/modules/arbitrage/enums/arbitrage-type.enum';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { Types } from 'mongoose';
import { AlertDeliveryStatusEnum } from '../enums/alert-type.enum';

export const TableName = 'sent_alerts';

/** Отправленные Telegram-алерты (dedup + cooldown) */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class AlertDeliveryEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'TelegramUserEntity', required: true, index: true })
    telegramUserId: Types.ObjectId;

    @DatabaseProp({ type: String, required: true, index: true })
    fingerprint: string;

    @DatabaseProp({ type: String, enum: ArbitrageTypeEnum, required: true, index: true })
    opportunityType: ArbitrageTypeEnum;

    @DatabaseProp({ type: String, required: true, index: true })
    symbolKey: string;

    @DatabaseProp({ type: String, required: true })
    baseAsset: string;

    @DatabaseProp({ type: String, required: true })
    quoteAsset: string;

    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true })
    spotExchange: ExchangeEnum;

    @DatabaseProp({ type: String, enum: ExchangeEnum, required: true })
    futuresExchange: ExchangeEnum;

    @DatabaseProp({ type: Number, required: true })
    netYieldPercent: number;

    @DatabaseProp({ type: Number, default: null })
    nextFundingTime?: number;

    @DatabaseProp({ type: String, required: true })
    message: string;

    @DatabaseProp({
        type: String,
        enum: AlertDeliveryStatusEnum,
        default: AlertDeliveryStatusEnum.PENDING,
    })
    status: AlertDeliveryStatusEnum;

    @DatabaseProp({ type: String, default: null })
    errorMessage?: string;

    @DatabaseProp({ type: Number, default: null, index: true })
    sentAt?: number;
}

export const AlertDeliverySchema = DatabaseSchema(AlertDeliveryEntity);

AlertDeliverySchema.index(
    { telegramUserId: 1, fingerprint: 1 },
    { unique: true, name: 'user_fingerprint_unique' },
);
AlertDeliverySchema.index(
    { telegramUserId: 1, opportunityType: 1, symbolKey: 1, sentAt: -1 },
    { name: 'user_type_symbol_sent' },
);

export type AlertDeliveryDoc = IDatabaseDocument<AlertDeliveryEntity>;
