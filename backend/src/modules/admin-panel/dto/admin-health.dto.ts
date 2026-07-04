import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthServiceStatus } from '../enums/admin-panel.enum';

export class AdminHealthServiceDto {
    @ApiProperty({ description: 'Статус', enum: HealthServiceStatus })
    status: HealthServiceStatus;

    @ApiProperty({ description: 'Сообщение' })
    message: string;

    @ApiProperty({ description: 'Время проверки' })
    checkedAt: string;

    @ApiPropertyOptional({ description: 'Последний успех' })
    lastSuccessAt?: string;

    @ApiPropertyOptional({ description: 'Последняя ошибка' })
    lastErrorAt?: string;
}

export class AdminHealthResponseDto {
    @ApiProperty({ description: 'Backend' })
    backend: AdminHealthServiceDto;

    @ApiProperty({ description: 'MongoDB' })
    mongo: AdminHealthServiceDto;

    @ApiProperty({ description: 'Redis' })
    redis: AdminHealthServiceDto;

    @ApiProperty({ description: 'BullMQ' })
    bullmq: AdminHealthServiceDto;

    @ApiProperty({ description: 'Mailer' })
    mailer: AdminHealthServiceDto;

    @ApiProperty({ description: 'Telegram' })
    telegram: AdminHealthServiceDto;

    @ApiProperty({ description: 'Sentry' })
    sentry: AdminHealthServiceDto;

    @ApiProperty({ description: 'LLM' })
    llm: AdminHealthServiceDto;

    @ApiProperty({ description: 'Ozon API summary' })
    ozonApi: AdminHealthServiceDto;
}
