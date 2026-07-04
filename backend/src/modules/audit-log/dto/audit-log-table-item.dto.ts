import { ApiProperty } from '@nestjs/swagger';

/** Краткая информация о пользователе для лога */
export class AuditLogUserShortDto {
    @ApiProperty({ description: 'ID пользователя' })
    _id: string;

    @ApiProperty({ description: 'Email пользователя' })
    email: string;
}

/** Элемент таблицы логов для GET /audit-log в унифицированном формате */
export class AuditLogTableItemDto {
    @ApiProperty({ description: 'ID лога' })
    id: string;

    @ApiProperty({ description: 'Тип (Видео, Пользователь, Push и т.д.)' })
    type: string;

    @ApiProperty({ description: 'Дата события в ISO' })
    date: string;

    @ApiProperty({ description: 'Человеческое описание действия' })
    action: string;

    @ApiProperty({ description: 'Email администратора' })
    email: string;

    @ApiProperty({ description: 'IP администратора', required: false })
    userIp?: string;

    @ApiProperty({
        description: 'Причина действия (бан, отклонение и т.д.)',
        required: false,
    })
    reason?: string;

    @ApiProperty({
        description: 'Пользователь, если действие над ним',
        required: false,
        type: AuditLogUserShortDto,
    })
    user?: AuditLogUserShortDto;
}
