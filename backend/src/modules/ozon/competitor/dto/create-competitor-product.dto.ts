import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/** DTO добавления товара конкурента по URL */
export class CreateCompetitorProductDto {
    @ApiProperty({ description: 'ID подключения Ozon', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;

    @ApiProperty({
        description: 'Ссылка на карточку товара Ozon',
        required: false,
        example: 'https://www.ozon.ru/product/smartphone-1234567890/',
    })
    @IsString()
    @IsOptional()
    @Length(1, 500)
    url?: string;

    @ApiProperty({ description: 'Ozon product_id', required: false })
    @IsString()
    @IsOptional()
    @Length(1, 50)
    productId?: string;

    @ApiProperty({ description: 'Ozon SKU', required: false })
    @IsString()
    @IsOptional()
    @Length(1, 50)
    sku?: string;

    @ApiProperty({ description: 'Offer ID продавца (если применимо)', required: false })
    @IsString()
    @IsOptional()
    @Length(1, 100)
    offerId?: string;
}

/** DTO ручной синхронизации всех конкурентов */
export class SyncAllCompetitorsDto {
    @ApiProperty({ description: 'ID подключения (опционально)', required: false })
    @IsMongoId()
    @IsOptional()
    connectionId?: string;
}

/** DTO истории снимков конкурента */
export class ListCompetitorSnapshotsQueryDto {
    @ApiProperty({ description: 'Лимит записей', required: false, default: 30 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number;
}
