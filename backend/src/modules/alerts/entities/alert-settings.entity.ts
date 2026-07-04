import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { Types } from 'mongoose';
import { AlertThresholdDto } from '../dto/alert-settings.dto';

export const TableName = 'alert_settings';

/** Настройки алертов пользователя Telegram */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class AlertSettingsEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'TelegramUserEntity', required: true, index: true })
    telegramUserId: Types.ObjectId;

    @DatabaseProp({ type: Boolean, default: true })
    enabled: boolean;

    @DatabaseProp({ type: [Object], default: [] })
    thresholds: AlertThresholdDto[];
}

export const AlertSettingsSchema = DatabaseSchema(AlertSettingsEntity);
export type AlertSettingsDoc = IDatabaseDocument<AlertSettingsEntity>;
