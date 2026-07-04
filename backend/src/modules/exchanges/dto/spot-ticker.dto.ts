import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ExchangeEnum } from '../enums/exchange.enum';

/** Spot-тикер (нормализованный) */
export class SpotTickerDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Унифицированный символ (BTC/USDT)' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Нативный символ биржи' })
    @IsString()
    nativeSymbol: string;

    @ApiProperty({ description: 'Последняя цена' })
    @IsNumber()
    lastPrice: number;

    @ApiProperty({ description: 'Лучшая цена bid' })
    @IsNumber()
    bidPrice: number;

    @ApiProperty({ description: 'Лучшая цена ask' })
    @IsNumber()
    askPrice: number;

    @ApiProperty({ description: 'Время котировки (unix ms)' })
    @IsNumber()
    timestamp: number;
}
