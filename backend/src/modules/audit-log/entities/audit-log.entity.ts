import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditCategory } from '../enums/audit-category.enum';
import { AuditStatus } from '../enums/audit-status.enum';

export const TableName = 'audit_logs';

/** Аудит действий админа (TZ п.2, п.7) */
@DatabaseEntity({ collection: TableName, timestamps: true })
export class AuditLogEntity {
    @DatabaseProp({ type: Types.ObjectId, ref: 'AdminUsersEntity', required: true })
    @ApiProperty({ description: 'ID администратора, выполнившего действие' })
    adminId: Types.ObjectId;

    @DatabaseProp({ type: String, enum: Object.values(AuditAction), required: true })
    @ApiProperty({ description: 'Тип действия', enum: AuditAction })
    action: AuditAction;

    @DatabaseProp({ type: String, required: true })
    @ApiProperty({ description: 'Сущность (например, users, orders, subscriptions)' })
    entity: string;

    @DatabaseProp({ type: String, enum: Object.values(AuditCategory), required: false })
    @ApiProperty({ description: 'Категория для группировки', enum: AuditCategory, required: false })
    category?: AuditCategory;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Название объекта (для таблицы)', required: false })
    objectName?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'ID сущности', required: false })
    entityId?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Описание действия', required: false })
    description?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Краткое описание для таблицы', required: false })
    summary?: string;

    @DatabaseProp({ type: String, enum: Object.values(AuditStatus), required: false })
    @ApiProperty({ description: 'Статус выполнения', enum: AuditStatus, required: false })
    status?: AuditStatus;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Причина / комментарий', required: false })
    reason?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'Результат выполнения', required: false })
    executionResult?: string;

    @DatabaseProp({ type: Object, required: false })
    @ApiProperty({ description: 'Данные до изменения', required: false })
    oldData?: Record<string, unknown>;

    @DatabaseProp({ type: Object, required: false })
    @ApiProperty({ description: 'Данные после изменения', required: false })
    newData?: Record<string, unknown>;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'IP адрес', required: false })
    ipAddress?: string;

    @DatabaseProp({ type: String, required: false })
    @ApiProperty({ description: 'User Agent', required: false })
    userAgent?: string;
}

export const AuditLogSchema = DatabaseSchema(AuditLogEntity);

// Индексы для оптимизации запросов
AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

export type AuditLogDoc = IDatabaseDocument<AuditLogEntity>;
