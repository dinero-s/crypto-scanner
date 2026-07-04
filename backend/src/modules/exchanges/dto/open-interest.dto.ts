import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ExchangeEnum } from '../enums/exchange.enum';

/** Open interest (нормализованный) */
export class OpenInterestDto {
    @ApiProperty({ description: 'Биржа', enum: ExchangeEnum })
    @IsEnum(ExchangeEnum)
    exchange: ExchangeEnum;

    @ApiProperty({ description: 'Унифицированный символ' })
    @IsString()
    symbol: string;

    @ApiProperty({ description: 'Нативный символ биржи' })
    @IsString()
    nativeSymbol: string;

    @ApiProperty({ description: 'Open interest (контракты или базовая валюта — зависит от биржи)' })
    @IsNumber()
    openInterest: number;

    @ApiProperty({ description: 'Open interest в quote (USDT), если доступно' })
    @IsNumber()
    openInterestValue: number;

    @ApiProperty({ description: 'Время снимка (unix ms)' })
    @IsNumber()
    timestamp: number;
}
