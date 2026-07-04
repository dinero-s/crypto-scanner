import { ApiProperty } from '@nestjs/swagger';

/** Элемент массива errors в ответе 400 при ошибках валидации (ValidationPipe exceptionFactory) */
export class ValidationErrorItemDto {
    @ApiProperty({ description: 'Поле (из DTO)', example: 'email' })
    field: string;

    @ApiProperty({ description: 'Сообщение из декоратора валидации', example: 'email должно быть email.' })
    message: string;
}

/** Тело ответа 400 при ошибках валидации: message — краткий текст, errors — по полям */
export class ValidationErrorResponseDto {
    @ApiProperty({ description: 'Краткий текст первой или объединённой ошибки', example: 'Ошибка валидации' })
    message: string;

    @ApiProperty({
        description: 'Массив ошибок по полям',
        type: [ValidationErrorItemDto],
        example: [{ field: 'email', message: 'email должно быть email.' }],
    })
    errors: ValidationErrorItemDto[];
}
