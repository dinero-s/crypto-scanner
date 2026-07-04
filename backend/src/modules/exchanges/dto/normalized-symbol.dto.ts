import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ExchangeEnum, MarketTypeEnum } from '../enums/exchange.enum';

/** Запрос нормализации символа */
export class NormalizeSymbolDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Тип рынка', enum: MarketTypeEnum })
    @IsEnum(MarketTypeEnum)
    marketType: MarketTypeEnum;

    @ApiProperty({ description: 'Символ (унифицированный или нативный)' })
    @IsString()
    symbol: string;
}

/** Ответ нормализации символа */
export class NormalizedSymbolResponseDto {
    @ApiProperty({ description: 'Унифицированный символ (BTC/USDT)' })
    @IsString()
    unified: string;

    @ApiProperty({ description: 'Нативный символ биржи' })
    @IsString()
    native: string;

    @ApiProperty({ description: 'Base asset' })
    @IsString()
    base: string;

    @ApiProperty({ description: 'Quote asset' })
    @IsString()
    quote: string;
}
