import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { OzonConnectionStatus } from '../../constants/ozon.enums';

export const OzonConnectionTableName = 'ozon_connections';

/** Подключение продавца к Ozon через официальные API-ключи */
@DatabaseEntity({ collection: OzonConnectionTableName, timestamps: true })
export class OzonConnectionEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    @ApiProperty({ description: 'ID пользователя' })
    userId: Types.ObjectId;

    @DatabaseProp({ type: String, required: true })
    @ApiProperty({ description: 'Название магазина' })
    sellerName: string;

    @DatabaseProp({ type: String, required: true })
    @ApiProperty({ description: 'Client-Id Ozon Seller API' })
    clientId: string;

    @DatabaseProp({ type: String, required: true })
    @ApiProperty({ description: 'Зашифрованный Api-Key' })
    encryptedApiKey: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Зашифрованный Performance Client-Id', required: false })
    encryptedPerformanceClientId?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({
        description: 'Зашифрованный Performance Client-Secret',
        required: false,
    })
    encryptedPerformanceClientSecret?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({
        description: 'Зашифрованный Performance Bearer-токен',
        required: false,
    })
    encryptedPerformanceToken?: string;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonConnectionStatus),
        default: OzonConnectionStatus.ACTIVE,
        index: true,
    })
    @ApiProperty({ description: 'Статус подключения', enum: OzonConnectionStatus })
    status: OzonConnectionStatus;

    @DatabaseProp({ type: [String], default: [] })
    @ApiProperty({ description: 'Разрешённые scope/permissions' })
    permissions: string[];

    @DatabaseProp({ type: Date, required: false })
    @ApiProperty({ description: 'Последняя синхронизация', required: false })
    lastSyncAt?: Date;

    @DatabaseProp({ type: Date, required: false })
    @ApiProperty({ description: 'Мягкое удаление', required: false })
    deletedAt?: Date;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Telegram chat_id для алертов', required: false })
    telegramChatId?: string;
}

export const OzonConnectionSchema = DatabaseSchema(OzonConnectionEntity);

OzonConnectionSchema.index({ userId: 1 });
OzonConnectionSchema.index({ userId: 1, status: 1 });
OzonConnectionSchema.index(
    { status: 1, deletedAt: 1, _id: 1 },
    { partialFilterExpression: { deletedAt: { $exists: false } } },
);

export type OzonConnectionDoc = IDatabaseDocument<OzonConnectionEntity>;
