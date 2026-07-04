import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Базовый DTO для фильтра по точному совпадению (опциональные поля) */
export class PaginationFilterEqualDto {
    @ApiProperty({ description: 'Фильтр по точному совпадению строки', required: false })
    @IsOptional()
    @IsString()
    equal?: string;
}
