import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import {
    OzonConnectionAuditAction,
    OzonConnectionAuditStatus,
} from '../../constants/ozon.enums';

export const OzonConnectionAuditTableName = 'ozon_connection_audits';

/** Аудит действий с подключением Ozon (уровень пользователя) */
@DatabaseEntity({ collection: OzonConnectionAuditTableName, timestamps: true })
export class OzonConnectionAuditEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: true, index: true })
    @ApiProperty({ description: 'ID пользователя' })
    userId: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, ref: 'OzonConnectionEntity', required: false, index: true })
    @ApiProperty({ description: 'ID подключения', required: false })
    connectionId?: Types.ObjectId;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonConnectionAuditAction),
        required: true,
        index: true,
    })
    action: OzonConnectionAuditAction;

    @DatabaseProp({
        type: String,
        enum: Object.values(OzonConnectionAuditStatus),
        required: true,
    })
    status: OzonConnectionAuditStatus;

    @DatabaseProp({ type: String, required: false })
    summary?: string;

    @DatabaseProp({ type: String, required: false })
    ipAddress?: string;
}

export const OzonConnectionAuditSchema = DatabaseSchema(OzonConnectionAuditEntity);

OzonConnectionAuditSchema.index({ userId: 1, createdAt: -1 });
OzonConnectionAuditSchema.index({ connectionId: 1, createdAt: -1 });

export type OzonConnectionAuditDoc = IDatabaseDocument<OzonConnectionAuditEntity>;
