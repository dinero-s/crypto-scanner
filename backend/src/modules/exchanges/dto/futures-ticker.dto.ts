import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ExchangeEnum } from '../enums/exchange.enum';

/** Futures/perpetual тикер (нормализованный) */
export class FuturesTickerDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Унифицированный символ (BTC/USDT)' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Нативный символ биржи' })
    @IsString()
    nativeSymbol: string;

    @ApiProperty({ description: 'Mark price' })
    @IsNumber()
    markPrice: number;

    @ApiProperty({ description: 'Index price' })
    @IsNumber()
    indexPrice: number;

    @ApiProperty({ description: 'Last price' })
    @IsNumber()
    lastPrice: number;

    @ApiProperty({ description: 'Время котировки (unix ms)' })
    @IsNumber()
    timestamp: number;
}
