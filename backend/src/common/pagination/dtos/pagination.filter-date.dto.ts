import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Базовый DTO фильтра с датами и пагинацией */
export class PaginationFilterDateDto {
    @ApiProperty({
        description: 'Дата от (ISO 8601)',
        required: false,
        example: '2026-03-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiProperty({
        description: 'Дата до (ISO 8601)',
        required: false,
        example: '2026-06-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiProperty({ description: 'Номер страницы', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiProperty({ description: 'Записей на странице', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}
