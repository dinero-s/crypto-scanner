import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditCategory } from '../enums/audit-category.enum';
import { AuditStatus } from '../enums/audit-status.enum';

/** Изменённое поле: старое → новое значение */
export class ChangedFieldDto {
    @ApiProperty({ description: 'Имя поля' })
    field: string;

    @ApiProperty({ description: 'Старое значение' })
    oldValue: unknown;

    @ApiProperty({ description: 'Новое значение' })
    newValue: unknown;
}

/** Детали записи аудита для GET /audit-log/:id */
export class AuditLogDetailDto {
    @ApiProperty({ description: 'ID записи' })
    id: string;

    @ApiProperty({ description: 'Дата и время' })
    createdAt: string;

    @ApiProperty({ description: 'Кто сделал (email)' })
    adminEmail: string;

    @ApiProperty({ description: 'Категория', enum: AuditCategory })
    category: AuditCategory;

    @ApiProperty({ description: 'Объект (название)' })
    objectName: string;

    @ApiProperty({ description: 'Действие', enum: AuditAction })
    action: AuditAction;

    @ApiProperty({ description: 'Статус', enum: AuditStatus })
    status: AuditStatus;

    @ApiProperty({ description: 'Краткое описание' })
    summary: string;

    @ApiProperty({ description: 'ID объекта' })
    entityId: string;

    @ApiProperty({ description: 'Полный объект (oldData + newData)' })
    fullObject: Record<string, unknown>;

    @ApiProperty({ description: 'Какие поля изменились', type: [ChangedFieldDto] })
    changedFields: ChangedFieldDto[];

    @ApiProperty({ description: 'Причина / комментарий' })
    reason: string;

    @ApiProperty({ description: 'Результат выполнения' })
    executionResult: string;

    @ApiProperty({ description: 'Данные до изменения' })
    oldData: Record<string, unknown>;

    @ApiProperty({ description: 'Данные после изменения' })
    newData: Record<string, unknown>;
}
