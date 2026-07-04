import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';
import { Types } from 'mongoose';

export const TableName = 'user_alert_settings';

/** Пороги и фильтры алертов пользователя Telegram */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class AlertSettingsEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'TelegramUserEntity', required: true, unique: true, index: true })
    telegramUserId: Types.ObjectId;

    @DatabaseProp({ type: Boolean, default: true })
    enabled: boolean;

    @DatabaseProp({ type: Number, default: 0.0003 })
    minFundingRate: number;

    @DatabaseProp({ type: Number, default: 0.02 })
    minNetYield: number;

    @DatabaseProp({ type: Number, default: 0 })
    minBasis: number;

    @DatabaseProp({ type: [String], enum: ExchangeEnum, default: [] })
    allowedExchanges: ExchangeEnum[];

    @DatabaseProp({ type: [String], default: [] })
    symbolsWhitelist: string[];

    @DatabaseProp({ type: Number, default: 3600 })
    alertCooldownSec: number;
}

export const AlertSettingsSchema = DatabaseSchema(AlertSettingsEntity);
export type AlertSettingsDoc = IDatabaseDocument<AlertSettingsEntity>;
