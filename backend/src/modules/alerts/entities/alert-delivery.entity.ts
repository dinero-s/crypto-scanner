import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import { AlertDeliveryStatusEnum, AlertTypeEnum } from '../enums/alert-type.enum';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

export const TableName = 'alert_deliveries';

/** История доставки Telegram-уведомлений */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class AlertDeliveryEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'TelegramUserEntity', required: true, index: true })
    telegramUserId: Types.ObjectId;

    @DatabaseProp({ type: String, enum: AlertTypeEnum, required: true })
    alertType: AlertTypeEnum;

    @DatabaseProp({ type: String, enum: ExchangeEnum, default: null })
    exchange?: ExchangeEnum;

    @DatabaseProp({ type: String, default: null })
    symbol?: string;

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

    @DatabaseProp({ type: Number, default: null })
    sentAt?: number;
}

export const AlertDeliverySchema = DatabaseSchema(AlertDeliveryEntity);
export type AlertDeliveryDoc = IDatabaseDocument<AlertDeliveryEntity>;
