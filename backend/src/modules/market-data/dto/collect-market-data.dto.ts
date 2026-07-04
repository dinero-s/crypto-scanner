import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ExchangeEnum } from 'src/modules/exchanges/enums/exchange.enum';

/** Параметры сбора market data */
export class CollectMarketDataDto {
    @ApiProperty({ description: 'Биржи для сбора', enum: ExchangeEnum, isArray: true })
    @IsArray()
    @IsEnum(ExchangeEnum, { each: true })
    exchanges: ExchangeEnum[];

    @ApiProperty({ description: 'Символы (унифицированные, напр. BTC/USDT)', isArray: true })
    @IsArray()
    @IsString({ each: true })
    symbols: string[];

    @ApiPropertyOptional({ description: 'Принудительный пересбор (игнор кэша)' })
    @IsOptional()
    force?: boolean;
}
