import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Запрос снимков market data */
export class MarketDataQueryDto {
    @ApiPropertyOptional({ description: 'Биржа', enum: ExchangeEnum })
    @IsOptional()
    @IsEnum(ExchangeEnum)
    exchange?: ExchangeEnum;

    @ApiPropertyOptional({ description: 'Символ (BTC/USDT)' })
    @IsOptional()
    @IsString()
    symbol?: string;

    @ApiPropertyOptional({ description: 'Лимит записей', default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(500)
    limit?: number = 50;
}
