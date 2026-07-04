import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';

export const TableName = 'telegram_users';

/** Пользователь Telegram Mini App */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class TelegramUserEntity {
    @DatabaseProp({ type: String, required: true, unique: true, index: true })
    telegramId: string;

    @DatabaseProp({ type: String, required: true, index: true })
    chatId: string;

    @DatabaseProp({ type: String, default: null })
    username?: string;

    @DatabaseProp({ type: String, default: null })
    firstName?: string;

    @DatabaseProp({ type: String, default: null })
    lastName?: string;

    @DatabaseProp({ type: String, default: 'ru' })
    languageCode: string;

    @DatabaseProp({
        type: String,
        enum: SubscriptionStatusEnum,
        default: SubscriptionStatusEnum.FREE,
    })
    subscriptionStatus: SubscriptionStatusEnum;

    @DatabaseProp({ type: Date, default: null })
    subscriptionExpiresAt?: Date;

    @DatabaseProp({ type: Date, default: null })
    lastSeenAt?: Date;
}

export const TelegramUserSchema = DatabaseSchema(TelegramUserEntity);
export type TelegramUserDoc = IDatabaseDocument<TelegramUserEntity>;
