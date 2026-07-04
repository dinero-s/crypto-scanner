import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ComplianceLogEvent } from 'src/modules/ozon/constants/ozon.enums';
import { ComplianceDecision, MarketplaceType } from '../enums/admin-panel.enum';

export const ComplianceLogTableName = 'compliance_logs';

/** Persisted compliance log — legal-by-design доказательство */
@DatabaseEntity({ collection: ComplianceLogTableName, timestamps: true })
export class ComplianceLogEntity {
    @DatabaseProp({ type: String, enum: Object.values(MarketplaceType), required: true, index: true })
    @ApiProperty({ description: 'Маркетплейс' })
    marketplace: MarketplaceType;

    @DatabaseProp({ type: Types.ObjectId, ref: 'UsersEntity', required: false, index: true })
    @ApiProperty({ description: 'ID пользователя', required: false })
    userId?: Types.ObjectId;

    @DatabaseProp({ type: Types.ObjectId, required: false, index: true })
    @ApiProperty({ description: 'ID подключения', required: false })
    connectionId?: Types.ObjectId;

    @DatabaseProp({ type: String, enum: Object.values(ComplianceLogEvent), required: true, index: true })
    @ApiProperty({ description: 'Событие compliance' })
    action: ComplianceLogEvent;

    @DatabaseProp({ type: String, required: false, index: true })
    @ApiProperty({ description: 'Хост запроса', required: false })
    requestHost?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Endpoint', required: false })
    endpoint?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'HTTP метод', required: false })
    method?: string;

    @DatabaseProp({ type: String, enum: Object.values(ComplianceDecision), required: true, index: true })
    @ApiProperty({ description: 'Решение compliance-слоя' })
    decision: ComplianceDecision;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Причина', required: false })
    reason?: string;

    @DatabaseProp({ type: Boolean, default: false, index: true })
    @ApiProperty({ description: 'Заблокирован ли запрос' })
    blocked: boolean;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Код ошибки', required: false })
    errorCode?: string;
}

export const ComplianceLogSchema = DatabaseSchema(ComplianceLogEntity);

ComplianceLogSchema.index({ createdAt: -1 });
ComplianceLogSchema.index({ marketplace: 1, decision: 1, createdAt: -1 });
ComplianceLogSchema.index({ blocked: 1, createdAt: -1 });

export type ComplianceLogDoc = IDatabaseDocument<ComplianceLogEntity>;
