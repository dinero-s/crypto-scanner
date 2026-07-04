import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

/** DTO подключения Ozon через официальные API-ключи */
export class CreateOzonConnectionDto {
    @ApiProperty({ description: 'Название магазина' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 200)
    sellerName: string;

    @ApiProperty({ description: 'Client-Id Ozon Seller API' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 100)
    clientId: string;

    @ApiProperty({ description: 'Api-Key Ozon Seller API' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 500)
    apiKey: string;

    @ApiProperty({
        description: 'Performance API Client-Id (опционально)',
        required: false,
    })
    @IsString()
    @IsOptional()
    @Length(1, 500)
    performanceClientId?: string;

    @ApiProperty({
        description: 'Performance API Client-Secret (опционально)',
        required: false,
    })
    @IsString()
    @IsOptional()
    @Length(1, 500)
    performanceClientSecret?: string;

    @ApiProperty({
        description: 'Performance API Bearer-токен (опционально, альтернатива client_id/secret)',
        required: false,
    })
    @IsString()
    @IsOptional()
    @Length(1, 500)
    performanceToken?: string;

    @ApiProperty({ description: 'Telegram chat_id для алертов Ozon', required: false })
    @IsString()
    @IsOptional()
    @Length(1, 32)
    telegramChatId?: string;
}
